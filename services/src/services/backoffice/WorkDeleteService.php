<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;

use helena\services\backoffice\cloning\WorkDelete;
use helena\entities\backoffice\DraftWork;
use helena\entities\backoffice\structs\WorkInfo;
use helena\services\backoffice\publish\WorkStateBag;
use helena\services\backoffice\publish\WorkFlags;
use minga\framework\ErrorException;

class WorkDeleteService extends BaseService
{
	const STEP_DELETE_DATASETS = 0;
	const STEP_DELETE_PERMISSIONS = 1;
	const STEP_DELETE_DEFINITIONS = 2; // incluyendo metadatos
	const STEP_COMPLETED = 3;

	private $state = null;

	public function StartDeleteWork($workId, $name = null)
	{
		$this->state = WorkStateBag::Create($workId);
		$this->state->SetTotalSteps(3);
		$this->state->SetProgressLabel('Eliminando datasets');
		return $this->state->ReturnState(false);
	}

	public function StepDeleteWork($key)
	{
		// Avanza
		$this->state = new WorkStateBag();
		$this->state->LoadFromKey($key);
		$delete = new WorkDelete($this->state);

		switch($this->state->Step())
		{
			case self::STEP_DELETE_DATASETS:
				$done = $delete->DeleteDatasets();
				if ($done)
				{
					$this->state->NextStep('Quitando permisos');
				}
				return $this->state->ReturnState(false);
			case self::STEP_DELETE_PERMISSIONS:
				$delete->DeletePermissions();
				$this->state->NextStep('Eliminando');
				return $this->state->ReturnState(false);
			case self::STEP_DELETE_DEFINITIONS:
				$delete->DeleteWork();
				$this->state->NextStep('Completando');
				return $this->state->ReturnState(true);
			default:
				throw new ErrorException('Invalid step.');
			}
	}
}

