<?php

namespace helena\services\backoffice\cloning;

use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\db\admin\WorkModel;
use helena\classes\Account;
use minga\framework\Profiling;
use minga\framework\Arr;
use minga\framework\Str;

class WorkClone
{
	private	$targetWorkId;
	private	$sourceWorkId;
	private $state;

	public function __construct($state)
	{
		$this->state = $state;
		$this->sourceWorkId = $this->state->Get('workId');
		$this->targetWorkId = $this->state->Get('targetWorkId');
	}
	public function CreateWork()
	{
		Profiling::BeginTimer();

		$name = $this->state->Get('name');
		$this->doCreateNewWork($name);
		$this->CopyMetadata();

		$this->state->Set('targetWorkId', $this->targetWorkId);

		Profiling::EndTimer();
	}

	public function CopyDatasets()
	{
		Profiling::BeginTimer();

		$workModel = new WorkModel();
		$datasets = $workModel->GetDatasets($this->sourceWorkId);
		$totalSlices = sizeof($datasets);
		$this->state->SetTotalSlices($totalSlices);
		if ($totalSlices == 0)
		{
			Profiling::EndTimer();
			return true;
		}
		$dataset = $datasets[$this->state->Slice()];
		$cloner = new DatasetClone($this->sourceWorkId, $dataset['dat_caption'], $dataset['dat_id'], $this->targetWorkId);
		$cloner->CloneDataset();

		$this->state->NextSlice();

		Profiling::EndTimer();
		return $totalSlices === $this->state->Slice();
	}

	private function doCreateNewWork($newName = null)
	{
		if ($newName === null)
		{
			$work = App::Orm()->find(entities\DraftWork::class, $this->sourceWorkId);
			$newName = $work->getMetadata()->getTitle();
			$userId = Account::Current()->GetUserId();
			$newName = RowDuplicator::ResolveNewName($newName, 'draft_work, draft_metadata, draft_work_permission', $userId, 'wrk_metadata_id = met_id AND wkp_work_id = wrk_id AND wkp_user_id', 'met_caption');
		}
		$this->state->Set('name', $newName);
		$this->targetWorkId = RowDuplicator::DuplicateRows(entities\DraftWork::class, $this->sourceWorkId);
	}
	public function CopyMetadata()
	{
		// Copia metadatos
		$work = App::Orm()->find(entities\DraftWork::class, $this->sourceWorkId);
		$sourceMetadataId = $work->getMetadata()->getId();
		$newName = $this->state->Get('name');
		$static = array('met_title' => $newName);
		$metadataId = RowDuplicator::DuplicateRows(entities\DraftMetadata::class, $sourceMetadataId, $static);
		// Corrige encabezado
		$update = "UPDATE draft_work SET wrk_metadata_id = ? WHERE wrk_id = ?";
		App::Db()->exec($update, array($metadataId, $this->targetWorkId));
		// Decide si duplica Contact
		if ($work->getType() !== 'P' && $work->getMetadata()->getContact())
		{	// Clona el contacto
			$contactId = RowDuplicator::DuplicateRows(entities\DraftContact::class, $work->getMetadata()->getContact()->getId());
			$contact = "UPDATE draft_metadata SET met_contact_id = ? WHERE met_id = ?";
			App::Db()->exec($contact, array($contactId, $metadataId));
		}
	}

	public function CopyPermissions()
	{
		// Copia permisos
		$static = array('wkp_work_id' => $this->targetWorkId);
		RowDuplicator::DuplicateRows(entities\DraftWorkPermission::class, $this->sourceWorkId, $static, 'wkp_work_id');
	}
}

