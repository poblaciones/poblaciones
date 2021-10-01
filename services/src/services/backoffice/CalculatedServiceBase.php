<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\backoffice\publish\CalculateMetricStateBag;
use helena\services\backoffice\publish\WorkFlags;
use helena\entities\backoffice as entities;

use helena\services\common\BaseService;
use minga\framework\PublicException;

abstract class CalculatedServiceBase extends BaseService
{
	const STEP_CREATE_VARIABLES = 0;
	const STEP_PREPARE_DATA = 1;
	const STEP_UPDATE_ROWS = 2;
	const STEP_CREATE_METRIC = 3;
	const STEP_COMPLETED = 4;

	protected $calculator = null;
	protected $state = null;

	public function StartCalculate($datasetId, $source, $output)
	{
		$this->CompleteSource($source);
		$this->state = CalculateMetricStateBag::Create($datasetId, $source, $output);
		$this->state->SetTotalSteps($this->TotalSteps());
		$this->state->SetProgressLabel('Creando variables');
		return $this->state->ReturnState(false);
	}

	private function CompleteSource(& $source)
	{
		$dataset = $this->calculator->GetSourceDatasetByVariableId($source['VariableId']);

		$source['datasetType'] = $dataset->getType();
		$source['datasetTable'] = $dataset->getTable();
	}

	public function TotalSteps()
	{
		return self::STEP_COMPLETED;
	}

	public function StepCalculate($key)
	{
		$this->state = new CalculateMetricStateBag();
		$this->state->LoadFromKey($key);

		$datasetId = $this->state->Get('datasetId');
		$source = $this->state->Get('source');
		$output = $this->state->Get('output');
		$cols = $this->state->Get('cols');
		if ($cols) $cols = json_decode($cols, true);

		$calculator = $this->calculator;

		switch($this->state->Step())
		{
			case self::STEP_CREATE_VARIABLES:
				$cols = $calculator->StepCreateColumns($datasetId, $source, $output);
				$this->state->Set('cols', $this->saveColumns($cols));
				$this->state->NextStep('Preparando datos');
				break;
			case self::STEP_PREPARE_DATA:
				$calculator->StepPrepareData($datasetId, $cols);
				$this->state->NextStep('Calculando distancias');
				break;
			case self::STEP_UPDATE_ROWS:
				$totalSlices = $this->state->GetTotalSlices();
				if ($totalSlices == 0)
				{
					$totalSlices = $calculator->GetTotalSlices($datasetId);
					$this->state->SetTotalSlices($totalSlices);
				}
				if ($calculator->StepUpdateDataset($key, $datasetId, $cols, $source,
							$output, $this->state->Slice(), $totalSlices) == false)
				{
					$this->state->NextSlice();
				}
				else
				{
					$this->state->NextStep('Creando variables');
				}
				break;
			case self::STEP_CREATE_METRIC:

				$metrics = $calculator->StepCreateMetrics($datasetId, $cols, $source, $output);
				$this->state->SetResult(implode(',', $metrics));

				// Marca work
				$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
				$workId = $dataset->getWork()->getId();
				WorkFlags::SetMetricDataChanged($workId);
				WorkFlags::SetDatasetDataChanged($workId);

				$this->state->NextStep('Listo');
				break;
			default:
				throw new PublicException('Paso inválido');
		}
		return $this->state->ReturnState($this->IsCompleted());
	}

	private function IsCompleted()
	{
		return $this->state->Step() == self::STEP_COMPLETED;
	}

	private function saveColumns($cols)
	{
		$asString = App::OrmSerialize($cols);
		$asArray = json_decode($asString, true);
		foreach($cols as $key => $value)
		{
			$asArray[$key]['Field'] = $value->getField();
		}
		return json_encode($asArray);
	}
}

