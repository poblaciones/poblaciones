<?php

namespace helena\services\backoffice\upload;

use helena\classes\StateBag;

class UploadStateBag extends StateBag
{
	public static function Create($datasetId, $defaultBucketId)
	{
		$ret = new UploadStateBag();
		$ret->Initialize($defaultBucketId);
		$folder = $ret->GetFolder();

		$ret->SetArray(array(
			'datasetId' => $datasetId,
			'inFile' => $folder,
			'index' => 0,
			'start' => 0,
			'progressLabel' => 'Subiendo archivo'
		));
		return $ret;
	}

	public function GetFileFolder(){
		return $this->state['inFile'];
	}

	public function GetKeepLabels()
	{
		return $this->state['keepLabels'];
	}
	public function GetDatasetId()
	{
		return $this->state['datasetId'];
	}
	public function GetHeaderFilename()
	{
		return $this->GetFileFolder() . '/header.json';
	}

	public function GetHeaders()
	{
		$file = $this->GetHeaderFilename();
		return DatasetTable::ReadHeadersFromJson($file);
	}

	public function SetColWidth($keyCol, $value)
	{
		$this->state['cols'][$keyCol]['field_width'] = $value;
	}

	public function Cols()
	{
		return $this->state['cols'];
	}

}

