<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;

use helena\services\backoffice\cloning\WorkDelete;
use helena\services\backoffice\publish\WorkStateBag;
use minga\framework\PublicException;

class WorkDeleteService extends BaseService
{
	const STEP_DELETE_DATASETS = 0;
	const STEP_DELETE_PERMISSIONS = 1;
	const STEP_DELETE_DEFINITIONS = 2; // incluyendo metadatos
	const STEP_COMPLETED = 3;

	private $state = null;

	public function StartDeleteWork($workId, $name = null)
	{
		// Este multipaso invoca primero a los pasos de revocar publicación, y luego
		// ejecuta sus pasos.
		$revoke = new RevokeService();
		$this->state = WorkStateBag::Create($workId);
		$this->state->SetTotalSteps(3 + $revoke->TotalSteps());
		$this->state->SetProgressLabel('Eliminando datasets');
		return $this->state->ReturnState(false);
	}

	public function StepDeleteWork($key)
	{
		// Avanza
		$this->state = new WorkStateBag();
		$this->state->LoadFromKey($key);
		$delete = new WorkDelete($this->state);

		// Se fija si está revocando...
		$revoke = new RevokeService($this->state);
		if ($this->state->Step() < $revoke->TotalSteps())
		{
			return $revoke->StepRevoke($key, true);
		}

		switch($this->state->Step() - $revoke->TotalSteps())
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
				throw new PublicException('Paso inválido.');
			}
	}
}

