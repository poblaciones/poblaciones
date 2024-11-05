<?php

namespace helena\services\backoffice\cloning;

use minga\framework\Str;
use minga\framework\Profiling;
use helena\classes\DbFile;

use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\db\backoffice\WorkModel;
use helena\classes\Session;
use helena\classes\Account;
use helena\classes\Links;
use helena\services\backoffice\WorkService;
use helena\services\backoffice\publish\PublishDataTables;
use helena\services\backoffice\publish\WorkFlags;
use helena\services\backoffice\PermissionsService;

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
		if ($newName === null || $newName == '')
		{
			$work = App::Orm()->find(entities\DraftWork::class, $this->sourceWorkId);
			$newName = $work->getMetadata()->getTitle();
			$userId = Account::Current()->GetUserId();
			if (!$work->getIsExample())
			{
				$newName = RowDuplicator::ResolveNewName($newName, 'draft_work, draft_metadata, draft_work_permission', $userId, 'wrk_metadata_id = met_id AND wkp_work_id = wrk_id AND wkp_user_id', 'met_title', false, 150);
			}
		}
		$this->state->Set('name', $newName);
		$static = array('wrk_unfinished' => true, 'wrk_is_indexed' => 0, 'wrk_is_example' => 0);
		$this->targetWorkId = RowDuplicator::DuplicateRows(entities\DraftWork::class, $this->sourceWorkId, $static);
		$cloned = App::Orm()->find(entities\DraftWork::class, $this->targetWorkId);
		// Crea la tabla de trabajo para chunks
		WorkService::CreateChunksTable($cloned->getId());

		// Copia el file de preview y de imageId
		$file = $cloned->getImage();
		if ($file)
		{
			$newFileId = $this->DuplicateFile($file->getId());
			$newFile = App::Orm()->find(entities\DraftFile::class, $newFileId);
			$cloned->setImage($newFile);
		}
		$previewFileId = $cloned->getPreviewFileId();
		if ($previewFileId)
		{
			$newPreviewFileId = $this->DuplicateFile($previewFileId);
			$cloned->setPreviewFileId($newPreviewFileId);
		}
		// Guarda y setea cambios
		WorkFlags::Save($cloned);
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
		App::Db()->markTableUpdate('draft_work');
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
			// Copia el adjunto
			$newFileId = $this->DuplicateFile($file->getFile()->getId());
			// Copia el metadataFile
			$static = array('mfi_metadata_id' => $metadataId, 'mfi_file_id' => $newFileId);
			$sourceMetadataFileId = $file->getId();
			RowDuplicator::DuplicateRows(entities\DraftMetadataFile::class, $sourceMetadataFileId, $static, 'mfi_id');
		}
	}

	private function DuplicateFile($fileId)
	{
		// Copia el file
		$static = array();
		$sourceFileId = $fileId;
		$newFileId = RowDuplicator::DuplicateRows(entities\DraftFile::class, $sourceFileId, $static, 'fil_id');
		$static = array('chu_file_id' => $newFileId);
		RowDuplicator::DuplicateRows(entities\DraftFileChunk::class, $sourceFileId, $static, 'chu_file_id');
		// Copia los chunks de work
		$src_table = DbFile::GetChunksTableName(true, $this->sourceWorkId);
		$target_table = DbFile::GetChunksTableName(true, $this->targetWorkId);
		$sql = "INSERT INTO " . $target_table . "(chu_file_id, chu_content) SELECT ?, chu_content FROM " . $src_table . " WHERE chu_file_id = ?";
		App::Db()->exec($sql, array($newFileId, $sourceFileId));
		App::Db()->markTableUpdate($target_table);
		return $newFileId;
	}

	public function CopyIcons()
	{
		$src_table = DbFile::GetChunksTableName(true, $this->sourceWorkId);
		$target_table = DbFile::GetChunksTableName(true, $this->targetWorkId);

		$icons = App::Orm()->findManyByProperty(entities\DraftWorkIcon::class, "Work.Id", $this->sourceWorkId);
		foreach($icons as $icon)
		{
			// Copia el adjunto
			$newIconId = $this->DuplicateFile($icon->getFile()->getId());
			// Copia el workIcon
			$static = array('wic_work_id' => $this->targetWorkId, 'wic_file_id' => $newIconId);
			$workIconId = $icon->getId();
			RowDuplicator::DuplicateRows(entities\DraftWorkIcon::class, $workIconId, $static, 'wic_id');
		}
	}

	public function CopyCustomizeAndStartup()
	{
		// Clona el startup
		$work = App::Orm()->find(entities\DraftWork::class, $this->sourceWorkId);
		$startupId = RowDuplicator::DuplicateRows(entities\DraftWorkStartup::class, $work->getStartup()->getId());
		$update = "UPDATE draft_work SET wrk_startup_id = ? WHERE wrk_id = ?";
		App::Db()->exec($update, array($startupId, $this->targetWorkId));
		// Copia los extra metric
		$static = array('wmt_work_id' => $this->targetWorkId);
		RowDuplicator::DuplicateRows(entities\DraftWorkExtraMetric::class, $this->sourceWorkId, $static, 'wmt_work_id');
	}

	public function CopyPermissions()
	{
		$static = array('wkp_work_id' => $this->targetWorkId);

		$work = App::Orm()->find(entities\DraftWork::class, $this->sourceWorkId);
		if (!$work->getIsExample())
		{
			// Si no es ejemplo, copia lo existente
			RowDuplicator::DuplicateRows(entities\DraftWorkPermission::class, $this->sourceWorkId, $static, 'wkp_work_id');
		}
		// Se pone como administrador
		$permissionService = new PermissionsService();
		$userEmail = Session::GetCurrentUser()->user;
		$permissionService->AssignPermission($this->targetWorkId, $userEmail, 'A', false);
	}

	public function CopyDiskUsage()
	{
		$static = array('wdu_work_id' => $this->targetWorkId, 'wdu_data_bytes' => 0, 'wdu_index_bytes' => 0, 'wdu_attachment_bytes' => 0);
		RowDuplicator::DuplicateRows(entities\WorkSpaceUsage::class, $this->sourceWorkId, $static, 'wdu_work_id');
	}
	public function SetFinished()
	{
		$update = "UPDATE draft_work SET wrk_unfinished = ? WHERE wrk_id = ?";
		App::Db()->exec($update, array(0, $this->targetWorkId));
		App::Db()->markTableUpdate('draft_work');
	}
}

