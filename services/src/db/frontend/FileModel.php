<?php

namespace helena\db\frontend;

use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\IO;
use minga\framework\ErrorException;

class FileModel extends BaseModel
{
	public function __construct($fromDraft = false)
	{
		$this->fromDraft = $fromDraft;
		$this->tableName = $this->makeTableName('file', $fromDraft);
		$this->idField = 'fil_id';
		$this->captionField = 'fil_name';

	}
	public function ReadFileToFile($fileId, $filename)
	{
		Profiling::BeginTimer();
		$params = array($fileId);

		$sql = "SELECT chu_id FROM ". $this->makeTableName('file_chunk', $this->fromDraft) . " WHERE chu_file_id = ?";
		$parts = App::Db()->fetchAll($sql, $params);

		IO::WriteAllText($filename, '');

		foreach($parts as $part)
		{
			$params = array($part['chu_id']);
			$sql = "SELECT chu_content content FROM " . $this->makeTableName('file_chunk', $this->fromDraft) ." WHERE chu_id = ?";
			$row = App::Db()->fetchAssoc($sql, $params);
			IO::AppendAllBytes($filename, $row['content']);
			$row = null;
		}
		Profiling::EndTimer();
	}


	public function SendFile($fileId, $friendlyName = '')
	{
		if ($friendlyName == "") $friendlyName = $fileId;

		$outFile = IO::GetTempFilename();
		$this->ReadFileToFile($fileId, $outFile);
		return App::SendFile($outFile)
			->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $friendlyName)
			->deleteFileAfterSend(true);
	}
}
