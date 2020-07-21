<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\PdfReader;
use minga\framework\FileBucket;
use minga\framework\ErrorException;

class FileService extends BaseService
{
	const PAGESIZE = 1024 * 1024;

	public function SaveFile($fileObject, $tempFilename, $toDrafts, $fileType)
	{
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
			$fileObject->setType($fileType);
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

	public function ConvertFiletoBase64($file_path)
	{
		$finfo = finfo_open(FILEINFO_MIME_TYPE);
		$type = finfo_file($finfo, $file_path);
		return 'data:'.$type.';base64,'.base64_encode(file_get_contents($file_path));
	}
}

