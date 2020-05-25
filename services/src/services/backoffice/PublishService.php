<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;

use helena\services\backoffice\notifications\NotificationManager;
use helena\services\backoffice\publish\WorkStateBag;
use helena\services\backoffice\publish\PublishDataTables;
use helena\services\backoffice\publish\WorkFlags;
use helena\services\backoffice\publish\PublishSnapshots;
use helena\services\backoffice\publish\RevokeSnapshots;
use helena\db\admin\WorkModel;
use helena\classes\App;
use helena\entities\backoffice as entities;
use minga\framework\ErrorException;

class PublishService extends BaseService
{

	const STEP_DELETE_DATASETS = 0;
	const STEP_DELETE_SNAPSHOTS_DATASETS = 1;
	const STEP_DELETE_SNAPSHOTS_METRICS_AND_DEFINITIONS = 2;
	const STEP_COPY_DEFINITIONS = 3;
	const STEP_COPY_DATASETS = 4;
	const STEP_CREATE_SNAPSHOTS_DATASETS = 5;
	const STEP_UPDATE_EXTENTS = 6;
	const STEP_RESET_FLAGS = 7;
	const STEP_COMPLETED = 8;

	private $state = null;

	public function StartPublication($workId)
	{
		$this->state = WorkStateBag::Create($workId);
		$this->state->SetTotalSteps(self::STEP_COMPLETED);
		$this->state->SetProgressLabel('Preparando datasets');
		// Se fija los flags... si todo está limpio, entiende que están queriendo
		// forzar una republicación completa.
		if (WorkFlags::AllAreUnset($workId))
			WorkFlags::SetAll($workId);
		// Anvaza
		return $this->state->ReturnState(false);
	}

	public function StepPublication($key)
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
				if ($this->DatasetsChanged($workId))
				{
					$publisher->DeleteDatasetsTables($workId);
				}
				$this->state->NextStep('Preparando índices');
				break;
			case self::STEP_DELETE_SNAPSHOTS_DATASETS:
				$manager = new RevokeSnapshots($workId);
				$manager->DeleteMissingWorkDatasets();
				$this->state->NextStep('Preparando indicadores');
				break;
			case self::STEP_DELETE_SNAPSHOTS_METRICS_AND_DEFINITIONS:
				// DELETE DEFINITIONS
				$publisher = new PublishDataTables();
				$publisher->DeleteWorkTables($workId);
				$this->state->NextStep('Copiando definiciones');
				break;
			case self::STEP_COPY_DEFINITIONS:
				$publisher = new PublishDataTables();
				$publisher->CopyDraftTables($workId);
				$this->state->NextStep('Copiando datos');
				break;
			case self::STEP_COPY_DATASETS:
				$publisher = new PublishDataTables();
				if ($this->DatasetsChanged($workId) &&
						$publisher->CopyDatasets($workId, $this->state->Slice(), $totalSlices) == false)
				{
					$this->NextSlice($totalSlices);
				}
				else
				{
					$this->state->NextStep('Precalculando indicadores');
				}
				break;
			case self::STEP_CREATE_SNAPSHOTS_DATASETS:
				$manager = new PublishSnapshots();
				if ($manager->UpdateWorkDatasets($workId, $this->state->Slice(), $totalSlices) == false)
				{
					$this->NextSlice($totalSlices);
				}
				else
				{
					$this->state->NextStep('Actualizando metadatos');
				}
				break;
			case self::STEP_UPDATE_EXTENTS:
				$manager = new PublishSnapshots();
				$manager->UpdateWorkMetricVersions($workId);
				$manager->UpdateExtents($workId);
				$this->state->NextStep('Completando');
				break;
			case self::STEP_RESET_FLAGS:
				$publisher = new PublishDataTables();
				$publisher->CleanWorkCaches($workId);
				$publisher->UpdateOnlineDates($workId);
				$publicUrl = $publisher->UpdatePublicUrl($workId);
				$publicUrl = $this->AppendPublicLink($workId, $publicUrl);
				WorkFlags::ClearAll($workId);
				// Manda un mensaje administrativo avisando del nuevo elemento
				$nm = new NotificationManager();
				$nm->NotifyPublish($workId);
				$this->state->SetVisitUrl($publicUrl, 'Ver mapa');
				$this->state->NextStep('Listo');
				break;
			default:
				throw new ErrorException('Invalid step.');
		}

		$done = ($this->state->Step() == self::STEP_COMPLETED);
		return $this->state->ReturnState($done);
	}

	private function AppendPublicLink($workId, $publicUrl)
	{
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$link = $work->getAccessLink();
		if ($link)
		{
			$publicUrl .= '/' . $link;
		}
		return $publicUrl;
	}

	private function DatasetsChanged($workId)
	{
		$workModel = new WorkModel();
		$work = $workModel->GetWork($workId);
		return $work['wrk_dataset_data_changed'] != false;
	}
	private function NextSlice($totalSlices)
	{
		$this->state->NextSlice();
		$this->state->SetTotalSlices($totalSlices);
	}
}

