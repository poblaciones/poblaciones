<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;

use helena\services\backoffice\publish\WorkStateBag;
use helena\services\backoffice\publish\WorkFlags;
use helena\services\backoffice\cloning\WorkClone;
use helena\services\backoffice\publish\PublishDataTables;
use minga\framework\PublicException;

class WorkCloneService extends BaseService
{
	const STEP_COPY_DEFINITIONS = 0; // incluyendo metadatos
	const STEP_COPY_DATASETS = 1;
	const STEP_COPY_PERMISSIONS = 2;
	const STEP_RESET_FLAGS = 3;
	const STEP_COMPLETED = 4;

	private $state = null;

	public function StartCloneWork($workId, $name = null)
	{
		$this->state = WorkStateBag::Create($workId);
		$this->state->SetTotalSteps(5);
		$this->state->Set('name', $name);
		$this->state->SetProgressLabel('Copiando definiciones');
		return $this->state->ReturnState(false);
	}

	public function StepCloneWork($key)
	{
		// Avanza
		$this->state = new WorkStateBag();
		$this->state->LoadFromKey($key);
		$cloner = new WorkClone($this->state);

		switch($this->state->Step())
		{
			case self::STEP_COPY_DEFINITIONS:
				$cloner->CreateWork();
				$this->state->NextStep('Copiando datos');
				return $this->state->ReturnState(false);
			case self::STEP_COPY_DATASETS:
				$done = $cloner->CopyDatasets();
				if ($done)
				{
					$this->state->NextStep('Copiando permisos');
				}
				return $this->state->ReturnState(false, array('targetWorkId'));
			case self::STEP_COPY_PERMISSIONS:
				$cloner->CopyCustomizeAndStartup();
				$cloner->CopyPermissions();
				$cloner->CopyIcons();
				$cloner->CopyDiskUsage();
				$this->state->NextStep('Actualizando estados');
				return $this->state->ReturnState(false);
			case self::STEP_RESET_FLAGS:
				$targetWorkId = $this->state->Get('targetWorkId');
				WorkFlags::SetAll($targetWorkId);
				$cloner->SetFinished();
				$this->state->NextStep('Listo');
				return $this->state->ReturnState(true, array('targetWorkId'));
			default:
				throw new PublicException('Paso inválido.');
			}
	}
}

