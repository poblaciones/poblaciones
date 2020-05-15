<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;

use minga\framework\IO;
use helena\services\backoffice\metrics\MetricsCalculator;
use helena\services\backoffice\publish\WorkStateBag;
use minga\framework\ErrorException;

class CalculateDistanceService extends BaseService
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

	public function StartCalculate($workId)
	{
		$this->state = WorkStateBag::Create($workId);
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
		// Desde acá controla los pasos de publicación
		$this->state = new WorkStateBag();
		$this->state->LoadFromKey($key);
		$workId = $this->state->Get('workId');
		$totalSlices = 0;

		switch($this->state->Step())
		{
			case self::STEP_CREATE_VARIABLES:
				//$publisher = new PublishDataTables();
				//$publisher->DeleteDatasetsTables($workId);
				$this->state->NextStep('Calculando distancias');
				break;
			case self::STEP_UPDATE_ROWS:
				$calculator = new MetricsCalculator();
				if ($calculator->UpdateDatasetDistance($workId, $this->state->Slice(), $totalSlices) == false)
				{
					$this->NextSlice($totalSlices);
				}
				else
				{
					$this->state->NextStep('Creando indicador');
				}
				break;
			case self::STEP_CREATE_METRIC:
				//$publisher = new PublishDataTables();
				//$publisher->DeleteWorkTables($workId);
				$this->state->NextStep('Listo');
				break;
			default:
				throw new ErrorException('Invalid step.');
		}
		$done = ($this->state->Step() == self::STEP_COMPLETED && !$isSubStepper);
		return $this->state->ReturnState($done);
	}
}

