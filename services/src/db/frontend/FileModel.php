<?php

namespace helena\db\frontend;

use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\IO;
use minga\framework\Str;
use minga\framework\PublicException;

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

	public function ReadWorkIcons($workId)
	{
		Profiling::BeginTimer();
		$params = array($workId);

		$sql = "SELECT wic_id, fil_name, fil_type, chu_id, chu_content
						FROM ". $this->makeTableName('work_icon', $this->fromDraft) . " icon
						JOIN ". $this->makeTableName('file', $this->fromDraft) . " file ON icon.wic_file_id = fil_id
						JOIN ". $this->makeTableName('file_chunk', $this->fromDraft) . " chunk ON file.fil_id = chu_file_id
						WHERE wic_work_id = ? ORDER BY wic_id, fil_id, chu_id";
		$parts = App::Db()->fetchAll($sql, $params);
		$ret = [];
		$lastWicId = null;
		$item = null;
		foreach($parts as $part)
		{
			if ($part['wic_id'] != $lastWicId)
			{
				if ($item !== null) $ret[] = $item;
				$item = ['Id' => $part['wic_id'], 'Type' => $part['fil_type'], 'Caption' => $part['fil_name'], 'Image' => ''];
			}
			$item['Image'] .= $part['chu_content'];
		}
		if ($item !== null) $ret[] = $item;

		// Los pasa a base64...
		foreach($ret as &$item)
		{
			$item['Image'] = 'data:'. $item['Type'] . ';base64,'.base64_encode($item['Image']);
			if (!$this->fromDraft)
			{
				unset($item['Id']);
				unset($item['Type']);
			}
		}
		Profiling::EndTimer();

		return $ret;
	}


	public function SendFile($fileId, $friendlyName = '')
	{
		if ($friendlyName == "") $friendlyName = $fileId;
		$friendlyName = Str::SanitizeFilename($friendlyName);

		$outFile = IO::GetTempFilename();
		$this->ReadFileToFile($fileId, $outFile);
		return App::SendFile($outFile)
			->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $friendlyName)
			->deleteFileAfterSend(true);
	}
}
