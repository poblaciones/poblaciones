<?php

namespace helena\services\backoffice;

use helena\services\backoffice\metrics\MetricsCalculator;
use helena\services\backoffice\publish\CalculateMetricStateBag;
use helena\services\common\BaseService;
use minga\framework\ErrorException;
use minga\framework\Profiling;

class CalculatedDistanceService extends BaseService
{
	const STEP_CREATE_VARIABLES = 0;
	const STEP_UPDATE_ROWS = 1;
	const STEP_CREATE_METRIC = 2;
	const STEP_COMPLETED = 3;

	private $state = null;

	function __construct($state = null)
	{
		$this->state = $state;
	}

	public function StartCalculate($datasetId, $source, $output)
	{
		$this->state = CalculateMetricStateBag::Create($datasetId, $source, $output);
		$this->state->SetTotalSteps($this->TotalSteps());
		$this->state->SetProgressLabel('Creando variables');
		return $this->state->ReturnState(false);
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

		$calculator = new MetricsCalculator();
		switch($this->state->Step())
		{
			case self::STEP_CREATE_VARIABLES:
				$cols = $calculator->StepCreateColumn($datasetId, $source, $output);
				$this->state->Set('cols', $cols);
				$this->state->NextStep('Calculando distancias');
				break;
			case self::STEP_UPDATE_ROWS:
				$slice = $this->state->Slice();
				if($slice == 0)
					$this->SetUpdateRowsStateLimits($datasetId, $source);

				$limit = $this->state->Get('limit');
				$cols = $this->state->Get('cols');
				$ret = $calculator->UpdateDatasetDistance($datasetId, $cols, $source, $output, $slice, $limit);
				if ($ret > 0)
					$this->state->NextSlice();
				else
					$this->state->NextStep('Creando indicador');
				break;
			case self::STEP_CREATE_METRIC:
				//$metric = new MetricService();
				//$metric->CreateMetric($datasetId);
				$this->state->NextStep('Listo');
				break;
			default:
				throw new ErrorException('Invalid step.');
		}
		return $this->state->ReturnState($this->IsCompleted());
	}

	private function SetUpdateRowsStateLimits($datasetId, $source)
	{
		$calculator = new MetricsCalculator();
		$ret = $calculator->GetTotalSlices($datasetId, $source);
		$this->state->Set('limit', $ret['limit']);
		$this->state->SetTotalSlices($ret['totalSlices']);
	}

	private function IsCompleted()
	{
		return $this->state->Step() == self::STEP_COMPLETED;
	}

}

