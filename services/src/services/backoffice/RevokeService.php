<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;

use minga\framework\IO;
use helena\services\backoffice\publish\WorkStateBag;
use helena\services\backoffice\publish\PublishDataTables;
use helena\services\backoffice\publish\WorkFlags;
use helena\services\backoffice\publish\RevokeSnapshots;
use minga\framework\ErrorException;

class RevokeService extends BaseService
{
	const STEP_DELETE_DATASETS = 0;
	const STEP_DELETE_SNAPSHOTS_DATASETS = 1;
	const STEP_DELETE_SNAPSHOTS_METRICS_AND_DEFINITIONS = 2;
	const STEP_RESET_FLAGS = 3;
	const STEP_COMPLETED = 4;

	private $state = null;

	public function StartRevoke($workId)
	{
		$this->state = WorkStateBag::Create($workId);
		$this->state->SetTotalSteps(4);
		$this->state->SetProgressLabel('Revocando publicación');
		return $this->state->ReturnState(false);
	}

	public function StepRevoke($key)
	{
		// Desde acá controla los pasos de publicación
		$this->state = new WorkStateBag();
		$this->state->LoadFromKey($key);
		$workId = $this->state->Get('workId');

		$totalSlices = 0;

		switch($this->state->Step())
		{
			case self::STEP_DELETE_DATASETS:
				$publisher = new PublishDataTables();
				$publisher->DeleteDatasetsTables($workId);
				$this->state->NextStep('Eliminando datos públicos');
				break;
			case self::STEP_DELETE_SNAPSHOTS_DATASETS:
				$manager = new RevokeSnapshots();
				$manager->DeleteWorkDatasets($workId, true);
				$this->state->NextStep('Eliminando indicadores públicos');
				break;
			case self::STEP_DELETE_SNAPSHOTS_METRICS_AND_DEFINITIONS:
				$manager = new RevokeSnapshots();
				$manager->DeleteWorkMetricVersions($workId, true);
				// DEFINICIONES
				$publisher = new PublishDataTables();
				$publisher->DeleteWorkTables($workId);
				$this->state->NextStep('Completando revocación');
				break;
			case self::STEP_RESET_FLAGS:
				$publisher = new PublishDataTables();
				$publisher->RevokeOnlineDates($workId);
				WorkFlags::SetAll($workId);
				$this->state->NextStep('Listo');
				break;
			default:
				throw new ErrorException('Invalid step.');
		}
		$done = ($this->state->Step() == self::STEP_COMPLETED);
		return $this->state->ReturnState($done);
	}
}

