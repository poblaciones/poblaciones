<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\PdfReader;
use minga\framework\Str;
use minga\framework\FileBucket;
use minga\framework\PublicException;
use helena\classes\Image;


class FileService extends BaseService
{
	const PAGESIZE = 1024 * 1024;

	public function SaveFile($fileObject, $tempFilename, $toDrafts, $fileType)
	{
		// Tiene que insertar en la base de datos
		$fileId = $fileObject->getId();
		// Guarda por si filename cambió o es nuevo
		if ($tempFilename != null)
		{
			$fileObject->setSize(filesize($tempFilename));
		}
		$fileObject->setType($fileType);

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
			$this->saveChunks($fileId, $tempFilename, $toDrafts);
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
	public function SaveBase64BytesToFile($watermarkImage, $fileObject, $maxWidth = null, $maxHeight = null)
	{

			$fileType = null;

		$bucket = $this->ConvertBase64toFile($watermarkImage);
		$file = $bucket->path . '/file.dat';
		if ($maxWidth || $maxHeight)
		{
			Image::ResizeToMaxSize($file, $maxWidth, $maxHeight);
		}
		if (Str::StartsWith($watermarkImage, "data:image/svg+xml;"))
			$fileType = "image/svg+xml";
		else
			$fileType = Image::GetImageMimeType($file);
		$this->SaveFile($fileObject, $file, true, $fileType);
		$bucket->Delete();
	}

	protected function makeTableName($table, $fromDraft)
	{
		if ($fromDraft)
			return 'draft_' . $table;
		else
			return $table;
	}

	private function saveChunks($fileId, $tempFilename, $toDrafts)
	{
		App::Db()->exec("DELETE FROM " . $this->makeTableName('file_chunk', $toDrafts) . " WHERE chu_file_id = ?", array($fileId));
		$unread = filesize($tempFilename);
		if (!file_exists($tempFilename))
			throw new PublicException('No se ha transferido correctamente el archivo al servidor.');
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

	public function ConvertBase64toFile($base64_string)
	{
		$bucket = FileBucket::Create();
		$path = $bucket->path;
		$output_file = $path . '/file.dat';

		// open the output file for writing
		$ifp = fopen($output_file, 'wb');

		// split the string on commas
		// $data[ 0 ] == "data:image/png;base64"
		// $data[ 1 ] == <actual base64 string>
		$data = explode(',', $base64_string);

		// we could add validation here with ensuring count( $data ) > 1
		fwrite($ifp, base64_decode($data[1]));

		// clean up the file resource
		fclose($ifp);

		return $bucket;
	}
	public function DeleteFile($fileId)
	{
		App::Db()->exec("DELETE FROM draft_file_chunk WHERE chu_file_id = ?", array($fileId));
		App::Db()->exec("DELETE FROM draft_file WHERE fil_id = ?", array($fileId));
	}

}

