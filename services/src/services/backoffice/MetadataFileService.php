<?php

namespace helena\services\backoffice;

use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\Str;
use minga\framework\PdfReader;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\FileBucket;
use helena\db\frontend\FileModel;
use minga\framework\PublicException;
use helena\services\backoffice\publish\WorkFlags;

class MetadataFileService extends BaseService
{
	const PAGESIZE = 1024 * 1024;

	public function GetNewMetadataFile($metadata)
	{
		$new = new entities\DraftMetadataFile();
		$new->setFile(new entities\DraftFile());
		return $new;
	}

	public function UpdateMetadataFile($workId, $bucketId, $metadataFile)
	{
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$metadata = $work->getMetadata();

		if ($metadataFile->getMetadata() !== null)
		{
		 if ($metadataFile->getMetadata() !== $metadata)
			throw new PublicException('Los metadatos indicados no coinciden con el adjunto.');
		}
		else
		{
			$metadataFile->setMetadata($metadata);
		}
		$order = $metadataFile->getOrder();
		if ($order === null)
		{
			$newOrder = App::Db()->fetchScalarIntNullable("SELECT max(mfi_order) FROM draft_metadata_file WHERE mfi_metadata_id = ?", array($metadata->getId()));
			if ($newOrder == null) $newOrder = 0;
				$metadataFile->setOrder($newOrder + 1);
		}
		$filename = null;
		$fileBucket = null;
		if ($bucketId != "")
		{
			$fileBucket = FileBucket::Load($bucketId);
			$filename = $fileBucket->path . '/file.dat';
		}
		$this->SaveMetadataFile($metadataFile, $filename, $workId);
		if ($fileBucket != null)
			$fileBucket->Delete();

		WorkFlags::SetMetadataDataChanged($workId);
		return $metadataFile;
	}
	private function LoadAndValidate($workId, $metadataFileId)
	{
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$metadata = $work->getMetadata();
		$metadataFile = App::Orm()->find(entities\DraftMetadataFile::class, $metadataFileId);
		if ($metadataFile->getMetadata() !== $metadata)
			throw new PublicException('Los metadatos indicados no coinciden con el adjunto.');
		return $metadataFile;
	}
	public function DeleteMetadataFile($workId, $metadataFileId)
	{
		$metadataFile = $this->LoadAndValidate($workId, $metadataFileId);
		// Borra
		$file = $metadataFile->getFile();
		App::Db()->exec("DELETE FROM draft_metadata_file WHERE mfi_id = ?", array($metadataFileId));
		App::Db()->markTableUpdate('draft_metadata_file');

		if ($file !== null)
		{
			$fileService = new FileService();
			$fileService->DeleteFile($file->getId());
		}
		WorkFlags::SetMetadataDataChanged($workId);
		return self::OK;
	}

	public function MoveMetadataFileUp($workId, $metadataFileId)
	{
		$metadataFile = $this->LoadAndValidate($workId, $metadataFileId);
		// Obtiene el anterior
		$previousFileId = App::Db()->fetchScalarNullable("SELECT mfi_id FROM draft_metadata_file WHERE mfi_metadata_id = ? AND mfi_order < ? ORDER BY mfi_order DESC LIMIT 1", array($metadataFile->getMetadata()->getId(), $metadataFile->getOrder()));
		if ($previousFileId === null)
			return self::OK;
		$metadataFileAlter = App::Orm()->find(entities\DraftMetadataFile::class, $previousFileId);
		if ($metadataFileAlter === null)
			return self::OK;
		// Actualiza
		$order1 = $metadataFileAlter->getOrder();
		$order2 = $metadataFile->getOrder();
		$metadataFile->setOrder($order1);
		$metadataFileAlter->setOrder($order2);
		App::Orm()->save($metadataFile);
		App::Orm()->save($metadataFileAlter);
		WorkFlags::SetMetadataDataChanged($workId);
		return self::OK;
	}

	public function MoveMetadataFileDown($workId, $metadataFileId)
	{
		$metadataFile = $this->LoadAndValidate($workId, $metadataFileId);
		// Obtiene el siguiente
		$nextFileId = App::Db()->fetchScalarNullable("SELECT mfi_id FROM draft_metadata_file WHERE mfi_metadata_id = ? AND mfi_order > ? ORDER BY mfi_order ASC LIMIT 1", array($metadataFile->getMetadata()->getId(), $metadataFile->getOrder()));
		if ($nextFileId === null)
			return self::OK;
		$metadataFileAlter = App::Orm()->find(entities\DraftMetadataFile::class, $nextFileId);
		if ($metadataFileAlter === null)
			return self::OK;
		// Actualiza
		$order1 = $metadataFileAlter->getOrder();
		$order2 = $metadataFile->getOrder();
		$metadataFile->setOrder($order1);
		$metadataFileAlter->setOrder($order2);
		App::Orm()->save($metadataFile);
		App::Orm()->save($metadataFileAlter);
		WorkFlags::SetMetadataDataChanged($workId);
		return self::OK;
	}
	public function GetAllMetadataFiles()
	{
		$records = App::Orm()->findAll(entities\DraftMetadataFile::class);
		return $records;
	}

	private function SaveMetadataFile($metadataFile, $tempFilename = null, $workId = null)
	{
		// Trae de la base de datos lo actual. Lo hace por sql porque lo que
		// vino desde el client está reconectado.
		if ($metadataFile->getId() !== 0 && $metadataFile->getId() !== null)
			$previuosFileId = App::Db()->fetchScalarIntNullable("SELECT mfi_file_id FROM draft_metadata_file WHERE mfi_id = ?", array($metadataFile->getId()));
		else
			$previuosFileId = null;

		// Guarda el archivo
		$toDrafts = true;

		$fs = new FileService();
		$fs->SaveFile($metadataFile->getFile(), $tempFilename, $toDrafts, 'application/pdf', $workId);

		// Guarda la metadata
		App::Orm()->save($metadataFile);

		// Borra huérfanos
		if ($previuosFileId !== null)
		{
			if ($metadataFile->getFile() === null || $metadataFile->getFile()->getId() !== $previuosFileId)
			{
				$fileService = new FileService();
				$fileService->DeleteFile($previuosFileId, $workId);
			}
		}
		return self::OK;
	}

	protected function makeTableName($table, $fromDraft)
	{
		if ($fromDraft)
			return 'draft_' . $table;
		else
			return $table;
	}

	public function GetMetadataFile($metadataId, $fileId)
	{
		$metadataFile = $this->GetMetadataFileByFileId($metadataId, $fileId);
		if ($metadataFile == null)
		  throw new PublicException("No se ha encontrado el adjunto especificado.");
		$friendlyName = $metadataFile['mfi_caption'];
		if (Str::EndsWith($friendlyName, '.pdf') == false)
				$friendlyName .= '.pdf';
		$workId = $metadataFile['work_id'];
		$fileModel = new FileModel(true, $workId);
		return $fileModel->SendFile($fileId, $friendlyName);
	}

	private function GetMetadataFileByFileId($metadataId, $fileId)
	{
		Profiling::BeginTimer();
		$params = array($metadataId, $fileId);
		$sql = "SELECT m.*, (SELECT wrk_id FROM draft_work WHERE wrk_metadata_id = mfi_metadata_id) AS work_id FROM draft_metadata_file m WHERE mfi_metadata_id = ? AND mfi_file_id = ? LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
}

