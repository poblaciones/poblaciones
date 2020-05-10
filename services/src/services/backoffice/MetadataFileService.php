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
use minga\framework\ErrorException;
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
			throw new ErrorException('Invalid metadata.');
		}
		else
		{
			$metadataFile->setMetadata($metadata);
		}
		$order = $metadataFile->getOrder();
		if ($order === null)
		{
			$newOrder = App::Db()->fetchScalarInt("SELECT max(mfi_order) FROM draft_metadata_file WHERE mfi_metadata_id = ?", array($metadata->getId()));
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
		$this->SaveMetadataFile($metadataFile, $filename);
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
			throw new ErrorException('Invalid metadata.');
		return $metadataFile;
	}
	public function DeleteMetadataFile($workId, $metadataFileId)
	{
		$metadataFile = $this->LoadAndValidate($workId, $metadataFileId);
		// Borra
		$file = $metadataFile->getFile();
		App::Db()->exec("DELETE FROM draft_metadata_file WHERE mfi_id = ?", array($metadataFileId));
		if ($file !== null)
		{
			$this->DeleteFile($file->getId());
		}
		WorkFlags::SetMetadataDataChanged($workId);
		return self::OK;
	}

	public function MoveMetadataFileUp($workId, $metadataFileId)
	{
		$metadataFile = $this->LoadAndValidate($workId, $metadataFileId);
		// Obtiene el anterior
		$previousFileId = App::Db()->fetchScalar("SELECT mfi_id FROM draft_metadata_file WHERE mfi_metadata_id = ? AND mfi_order < ? ORDER BY mfi_order DESC LIMIT 1", array($metadataFile->getMetadata()->getId(), $metadataFile->getOrder()));
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
		$nextFileId = App::Db()->fetchScalar("SELECT mfi_id FROM draft_metadata_file WHERE mfi_metadata_id = ? AND mfi_order > ? ORDER BY mfi_order ASC LIMIT 1", array($metadataFile->getMetadata()->getId(), $metadataFile->getOrder()));
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

	private function SaveMetadataFile($metadataFile, $tempFilename = null)
	{
		// Trae de la base de datos lo actual. Lo hace por sql porque lo que
		// vino desde el client está reconectado.
		if ($metadataFile->getId() !== 0 && $metadataFile->getId() !== null)
			$previuosFileId = App::Db()->fetchScalarInt("SELECT mfi_file_id FROM draft_metadata_file WHERE mfi_id = ?", array($metadataFile->getId()));
		else
			$previuosFileId = null;

		// Guarda el archivo
		$toDrafts = true;
		$this->SaveFile($metadataFile->getFile(), $tempFilename, $toDrafts);

		// Guarda la metadata
		App::Orm()->save($metadataFile);

		// Borra huérfanos
		if ($previuosFileId !== null)
		{
			if ($metadataFile->getFile() === null || $metadataFile->getFile()->getId() !== $previuosFileId)
			{
				$this->DeleteFile($previuosFileId);
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

	private function SaveFile($fileObject, $tempFilename, $toDrafts)
	{
		if ($fileObject === null && $tempFilename !== null)
			throw new ErrorException('File object must be specified in order to save the file.');

		if ($fileObject === null) return null;
		if ($tempFilename === null) return $fileObject;

		// Tiene que insertar en la base de datos
		$fileId = $fileObject->getId();
		// Guarda por si filename cambió o es nuevo
		$fileObject->setSize(filesize($tempFilename));
		App::Orm()->save($fileObject);
		$fileId = $fileObject->getId();
		// Ya tiene el id de file, sube los chunks
		if ($tempFilename != null)
		{
			// resuelve type
			$fileObject->setType('application/pdf');
			// resuelve páginas
			$pages = PdfReader::GetPageCount($tempFilename);
			if ($pages == 0) $pages = null;
			$fileObject->setPages($pages);
			App::Orm()->save($fileObject);
			// Graba
			$this->saveChunks($fileId, $tempFilename, $toDrafts);
		}
		return $fileObject;
	}

	private function saveChunks($fileId, $tempFilename, $toDrafts)
	{
		App::Db()->exec("DELETE FROM " . $this->makeTableName('file_chunk', $toDrafts) . " WHERE chu_file_id = ?", array($fileId));
		$unread = filesize($tempFilename);
		if (!file_exists($tempFilename))
			throw new ErrorException('No se ha transferido correctamente el archivo al servidor.');
		$handle = fopen($tempFilename, "rb");

		while($unread > 0)
		{
			$contents = fread($handle, self::PAGESIZE);
			$sql = "INSERT INTO " . $this->makeTableName('file_chunk', $toDrafts) . " (chu_file_id, chu_content) VALUES (?, ?)";
			App::Db()->exec($sql, array($fileId, $contents));
			$unread -= strlen($contents);
		}
		fclose($handle);
	}
	private function DeleteFile($fileId)
	{
		App::Db()->exec("DELETE FROM draft_file_chunk WHERE chu_file_id = ?", array($fileId));
		App::Db()->exec("DELETE FROM draft_file WHERE fil_id = ?", array($fileId));
	}

	public function GetMetadataFile($metadataId, $fileId)
	{
		$metadataFile = $this->GetMetadataFileByFileId($metadataId, $fileId);
		if ($metadataFile == null)
		  throw new ErrorException("Invalid file for metadata.");
		$friendlyName = $metadataFile['mfi_caption'];
		if (Str::EndsWith($friendlyName, '.pdf') == false)
				$friendlyName .= '.pdf';
		$type = 'application/pdf';

		$fileModel = new FileModel(true);
		return $fileModel->SendFile($fileId, $friendlyName);
	}

	private function GetMetadataFileByFileId($metadataId, $fileId)
	{
		Profiling::BeginTimer();
		$params = array($metadataId, $fileId);
		$sql = "SELECT * FROM draft_metadata_file WHERE mfi_metadata_id = ? AND mfi_file_id = ? LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
}

