<?php

namespace helena\services\backoffice\cloning;

use minga\framework\Str;
use minga\framework\Profiling;

use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\db\admin\WorkModel;
use helena\classes\Account;
use helena\classes\Links;
use helena\services\backoffice\publish\PublishDataTables;

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
			$newName = RowDuplicator::ResolveNewName($newName, 'draft_work, draft_metadata, draft_work_permission', $userId, 'wrk_metadata_id = met_id AND wkp_work_id = wrk_id AND wkp_user_id', 'met_title', false, 150);
		}
		$this->state->Set('name', $newName);
		$static = array('wrk_unfinished' => true);
		$this->targetWorkId = RowDuplicator::DuplicateRows(entities\DraftWork::class, $this->sourceWorkId, $static);
	}
	public function CopyMetadata()
	{
		$work = App::Orm()->find(entities\DraftWork::class, $this->sourceWorkId);
		// Clona el contacto
		$contactId = RowDuplicator::DuplicateRows(entities\DraftContact::class, $work->getMetadata()->getContact()->getId());
		// Copia metadatos
		$sourceMetadataId = $work->getMetadata()->getId();
		$newName = $this->state->Get('name');
		$shardifiedWorkId = PublishDataTables::Shardified($this->targetWorkId);
		$url = Links::GetWorkUrl($shardifiedWorkId);
		$static = array('met_title' => $newName, 'met_contact_id' => $contactId, 'met_url' => $url, 'met_online_since' => null, 'met_last_online' => null);
		$metadataId = RowDuplicator::DuplicateRows(entities\DraftMetadata::class, $sourceMetadataId, $static);
		// Corrige encabezado y accessLink
		$link = $work->getAccessLink();
		if ($link !== null) $link = Str::GenerateLink();
		$update = "UPDATE draft_work SET wrk_metadata_id = ?, wrk_last_access_link = null, wrk_access_link = ? WHERE wrk_id = ?";
		App::Db()->exec($update, array($metadataId, $link, $this->targetWorkId));
		// Copia metadata_sources
		$static = array('msc_metadata_id' => $metadataId);
		RowDuplicator::DuplicateRows(entities\DraftMetadataSource::class, $sourceMetadataId, $static, 'msc_metadata_id');
		// Copia metadata_files
		$this->CopyFiles($sourceMetadataId, $metadataId);
	}
	private function CopyFiles($sourceMetadataId, $metadataId)
	{
		$files = App::Orm()->findManyByProperty(entities\DraftMetadataFile::class, "Metadata.Id", $sourceMetadataId);
		foreach($files as $file)
		{
			// Copia el file
			$static = array();
			$sourceFileId = $file->getFile()->getId();
			$newFileId = RowDuplicator::DuplicateRows(entities\DraftFile::class, $sourceFileId, $static, 'fil_id');
			$static = array('chu_file_id' => $newFileId);
			RowDuplicator::DuplicateRows(entities\DraftFileChunk::class, $sourceFileId, $static, 'chu_file_id');
			// Copia el metadataFile
			$static = array('mfi_metadata_id' => $metadataId, 'mfi_file_id' => $newFileId);
			$sourceMetadataFileId = $file->getId();
			RowDuplicator::DuplicateRows(entities\DraftMetadataFile::class, $sourceMetadataFileId, $static, 'mfi_id');
		}
	}
	public function CopyPermissions()
	{
		// Copia permisos
		$static = array('wkp_work_id' => $this->targetWorkId);
		RowDuplicator::DuplicateRows(entities\DraftWorkPermission::class, $this->sourceWorkId, $static, 'wkp_work_id');
	}
	public function SetFinished()
	{
		$update = "UPDATE draft_work SET wrk_unfinished = ? WHERE wrk_id = ?";
		App::Db()->exec($update, array(0, $this->targetWorkId));
}
}

