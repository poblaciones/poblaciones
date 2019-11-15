<?php

namespace helena\entities\frontend\work;

use helena\entities\BaseMapModel;

class WorkInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $MetadataId;
	public $Abstract;
	public $ReleaseDate;
	public $Authors;
	public $License;
	public $IsPrivate;
	public $CanEdit;
	public $StartArgs;
	public $Coverage;
	public $Institution;
	public $Url;
	public $FileUrl;
	public $Files;
	public $Metrics;

	public static function GetMap()
	{
		return array (
			'wrk_id' => 'Id',

			'met_id' => 'MetadataId',
			'met_title' => 'Name',
			'met_authors' => 'Authors',
			'met_license' => 'License',
			'met_url' => 'Url',
			'met_abstract' => 'Abstract',
			'met_coverage_caption' => 'Coverage',
			'ins_caption' => 'Institution',

			'wrk_type' => 'Type',
			'wrk_is_private' => 'IsPrivate',
			'met_publication_date' => 'ReleaseDate',
			'wrk_start_args' => 'StartArgs',
			'wrk_image_id' => 'ImageId',
			'wrk_image_type' => 'ImageType'
			);
	}

	public function FillMetrics($rows)
	{
		$arr = array();
		foreach($rows as $row)
		{
			$versions = array();
			foreach(explode('\t', $row['Versions']) as $version)
				$versions[] = array('Name' => $version);
			$arr[] = array('Id' => $row['Id'], 'Name' => $row['Name'], 'Versions' => $versions);

		}
		$this->Metrics = $arr;
	}

	public function FillFiles($rows)
	{
		$arr = array();
		foreach($rows as $row)
		{
			$arr[] = array('Caption' => $row['Caption'], 'Web' => $row['Web'], 'FileId' => $row['FileId']);
		}
		$this->Files = $arr;
	}
}



