<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\backoffice\metrics\MetricsCalculator;
use helena\services\backoffice\publish\CalculateMetricStateBag;

use helena\services\common\BaseService;
use minga\framework\PublicException;
use minga\framework\Profiling;

class CalculatedDistanceService extends BaseService
{
	const STEP_CREATE_VARIABLES = 0;
	const STEP_PREPARE_DATA = 1;
	const STEP_UPDATE_ROWS = 2;
	const STEP_CREATE_METRIC = 3;
	const STEP_COMPLETED = 4;

	private $state = null;

	function __construct($state = null)
	{
		$this->state = $state;
	}

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
		$calculator = new MetricsCalculator();
		$dataset = $calculator->GetSourceDatasetByVariableId($source['VariableId']);

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

		$calculator = new MetricsCalculator();
		switch($this->state->Step())
		{
			case self::STEP_CREATE_VARIABLES:
				$cols = $calculator->StepCreateColumns($datasetId, $source, $output);
				$this->state->Set('cols', $cols);
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
				if ($calculator->StepUpdateDatasetDistance($key, $datasetId, $cols, $source,
							$output, $this->state->Slice(), $totalSlices) == false)
				{
					$this->state->NextSlice();
				}
				else
				{
					$this->state->NextStep('Creando indicador');
				}
				break;
			case self::STEP_CREATE_METRIC:
				//$metric = new MetricService();
				//$metric->CreateMetric($datasetId);
				//// Marca work
				//$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
				//WorkFlags::SetMetricDataChanged($dataset->getWork()->getId());

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

}

