<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;

use helena\services\backoffice\publish\WorkStateBag;
use helena\services\backoffice\publish\WorkFlags;
use helena\services\backoffice\cloning\WorkClone;
use minga\framework\PublicException;

class WorkTestService extends BaseService
{
	const STEP_COPY_DEFINITIONS = 0; // incluyendo metadatos
	const STEP_COPY_DATASETS = 1;
	const STEP_COPY_PERMISSIONS = 2;
	const STEP_RESET_FLAGS = 3;
	const STEP_COMPLETED = 4;

	private $state = null;

	public function StartTestWork($workId, $name = null)
	{
		$this->state = WorkStateBag::Create($workId);
		$this->state->SetTotalSteps(5);
		$this->state->Set('name', $name);
		$this->state->SetProgressLabel('Copiando definiciones');
		return $this->state->ReturnState(false);
	}

	public function StepTestWork($key)
	{
		// Avanza
		$this->state = new WorkStateBag();
		$this->state->LoadFromKey($key);
		sleep(1);
		switch($this->state->Step())
		{
			case self::STEP_COPY_DEFINITIONS:
				$this->state->NextStep('Copiando datos');
				return $this->state->ReturnState(false);
			case self::STEP_COPY_DATASETS:
				if($this->state->Slice() < 5)
				{
					$this->state->SetTotalSlices(5);
					$this->state->NextSlice();
				}
				else
				{
					$this->state->NextStep('Copiando permisos');
				}
				return $this->state->ReturnState(false);
			case self::STEP_COPY_PERMISSIONS:
				$this->state->NextStep('Actualizando estados');
				return $this->state->ReturnState(false);
			case self::STEP_RESET_FLAGS:
				$this->state->NextStep('Listo');
				return $this->state->ReturnState(true);
			default:
				throw new PublicException('Paso inválido.');
			}
	}
}

