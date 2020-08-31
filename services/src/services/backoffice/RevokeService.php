<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;

use helena\services\backoffice\publish\WorkStateBag;
use helena\services\backoffice\publish\PublishDataTables;
use helena\services\backoffice\publish\WorkFlags;
use helena\services\backoffice\publish\RevokeSnapshots;
use minga\framework\PublicException;

class RevokeService extends BaseService
{
	const STEP_DELETE_DATASETS = 0;
	const STEP_DELETE_SNAPSHOTS_DATASETS = 1;
	const STEP_DELETE_SNAPSHOTS_METRICS_AND_DEFINITIONS = 2;
	const STEP_RESET_FLAGS = 3;
	const STEP_COMPLETED = 4;

	private $state = null;

	function __construct($state = null)
	{
		$this->state = $state;
	}

	public function StartRevoke($workId)
	{
		$this->state = WorkStateBag::Create($workId);
		$this->state->SetTotalSteps($this->TotalSteps());
		$this->state->SetProgressLabel('Revocando publicación');
		return $this->state->ReturnState(false);
	}
	public function TotalSteps()
	{
		return self::STEP_COMPLETED;
	}
	public function StepRevoke($key, $isSubStepper = false)
	{
		// Desde acá controla los pasos de publicación
		$this->state = new WorkStateBag();
		$this->state->LoadFromKey($key);
		$workId = $this->state->Get('workId');

		switch($this->state->Step())
		{
			case self::STEP_DELETE_DATASETS:
				$publisher = new PublishDataTables();
				$publisher->DeleteDatasetsTables($workId);
				$this->state->NextStep('Eliminando datos públicos');
				break;
			case self::STEP_DELETE_SNAPSHOTS_DATASETS:
				$manager = new RevokeSnapshots($workId);
				$manager->DeleteAllWorkDatasets();
				$this->state->NextStep('Eliminando indicadores públicos');
				break;
			case self::STEP_DELETE_SNAPSHOTS_METRICS_AND_DEFINITIONS:
				$manager = new RevokeSnapshots($workId);
				$manager->DeleteAllWorkMetricVersions();
				// DEFINICIONES
				$publisher = new PublishDataTables();
				$publisher->DeleteWorkTables($workId);
				$this->state->NextStep('Completando revocación');
				break;
			case self::STEP_RESET_FLAGS:
				$publisher = new PublishDataTables();
				$publisher->CleanWorkCaches($workId);
				$publisher->RevokeOnlineDates($workId);
				WorkFlags::SetAll($workId);
				$this->state->NextStep('Listo');
				break;
			default:
				throw new PublicException('Paso inválido.');
		}
		$done = ($this->state->Step() == self::STEP_COMPLETED && !$isSubStepper);
		return $this->state->ReturnState($done);
	}
}

