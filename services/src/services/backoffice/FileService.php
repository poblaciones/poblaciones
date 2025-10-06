<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\PdfReader;
use helena\services\admin as adminServices;
use minga\framework\Str;
use minga\framework\FileBucket;
use minga\framework\PublicException;
use helena\classes\Image;
use helena\classes\DbFile;

class FileService extends BaseService
{
	const PAGESIZE = 1024 * 1024;

	public function SaveFile($fileObject, $tempFilename, $fileType, $workId = null)
	{
		// Tiene que insertar en la base de datos
		$fileId = $fileObject->getId();
		// Guarda por si filename cambió o es nuevo
		if ($tempFilename != null)
		{
			$fileObject->setSize(filesize($tempFilename));
		}
		$fileObject->setType($fileType);
		// Se fija si tiene que generarle un id
		if (!$this->isDraft)
		{
			$adminServices = new adminServices\MetadataService();
			$adminServices->EnsureId(entities\File::class, $fileObject);
		}
		App::Orm()->save($fileObject);
		$fileId = $fileObject->getId();
		// Ya tiene el id de file, sube los chunks
		if ($tempFilename != null)
		{
			$pages = null;
			if ($fileType === 'application/pdf') {
				// resuelve páginas
				$pages = PdfReader::GetPageCount($tempFilename);
				if ($pages == 0) $pages = null;
			}
			$fileObject->setPages($pages);
			App::Orm()->save($fileObject);
			// Graba
			$this->saveChunks($fileId, $tempFilename, $workId);
		}
		return $fileObject;
	}
	public function Create($name, $type)
	{
		$file = new entities\DraftFile();
		$file->setName($name);
		$file->setType($type);

		App::Orm()->Save($file);
		return $file;
	}
	public function SaveBase64BytesToFile($watermarkImage, $fileObject, $workId = null, $maxWidth = null, $maxHeight = null)
	{
		$fileType = null;

		$bucket = $this->ConvertBase64toFile($watermarkImage);
		$file = $bucket->path . '/file.dat';
		if (Str::StartsWith($watermarkImage, "data:image/svg+xml;"))
			$fileType = "image/svg+xml";
		else
		{
			if ($maxWidth || $maxHeight)
			{
				Image::ResizeToMaxSize($file, $maxWidth, $maxHeight);
			}
			$fileType = Image::GetImageMimeType($file);
		}
		$this->SaveFile($fileObject, $file, $fileType, $workId);
		$bucket->Delete();
	}

	private function saveChunks($fileId, $tempFilename, $workId = null)
	{
		$fileChunkTable = DbFile::GetChunksTableName($this->isDraft, $workId);
		App::Db()->exec("DELETE FROM " . $fileChunkTable . " WHERE chu_file_id = ?", array($fileId));
		App::Db()->markTableUpdate($fileChunkTable);
		$unread = filesize($tempFilename);
		if (!file_exists($tempFilename))
			throw new PublicException('No se ha transferido correctamente el archivo al servidor.');
		$handle = fopen($tempFilename, "rb");

		if ($fileChunkTable == 'file_chunk')
		{
			$idArgs = ", chu_id";
			$idParam = ", ?";
			$adminServices = new adminServices\MetadataService();
			$nextId = $adminServices->GetNextId(entities\FileChunk::class);
		}
		else {
			$idArgs = "";
			$idParam = "";
			$nextId = -1;
		}

		while($unread > 0)
		{
			$contents = fread($handle, self::PAGESIZE);
			$sql = "INSERT INTO " . $fileChunkTable . " (chu_file_id, chu_content" . $idArgs  . ") VALUES (?, ?" . $idParam . ")";
			$args = array($fileId, $contents);
			if ($idArgs != '')
			{
				$args[] = $nextId++;
			}
			App::Db()->exec($sql, $args);
			App::Db()->markTableUpdate($fileChunkTable);
			$unread -= strlen($contents);
		}
		fclose($handle);
	}

	public function ConvertBase64toFile($base64_string)
	{
		$bucket = FileBucket::Create();
		$path = $bucket->path;
		$output_file = $path . '/file.dat';

		// open the output file for writing
		$ifp = fopen($output_file, 'wb');

		// split the string on commas
		$data = explode(',', $base64_string);

		// we could add validation here with ensuring count( $data ) > 1
		fwrite($ifp, base64_decode($data[1]));

		// clean up the file resource
		fclose($ifp);

		return $bucket;
	}


	public function DeleteFile($fileId, $workId = null)
	{
		$table = DbFile::GetChunksTableName(true, $workId);
		App::Db()->exec("DELETE FROM " . $table . " WHERE chu_file_id = ?", array($fileId));
		App::Db()->exec("DELETE FROM draft_file WHERE fil_id = ?", array($fileId));
		App::Db()->markTableUpdate($table);
		App::Db()->markTableUpdate('draft_file');
	}

}

