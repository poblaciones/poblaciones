<?php

namespace helena\entities\frontend\work;

use helena\entities\BaseMapModel;
use helena\classes\GeoJson;

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
	public $Coverage;
	public $Institution;
	public $Url;
	public $FileUrl;
	public $Files;
	public $Metrics;
	public $Startup;

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

			'wrk_type' => 'Type',
			'wrk_is_private' => 'IsPrivate',
			'met_online_since' => 'ReleaseDate'
		);
	}

	public function FillMetrics($rows)
	{
		$arr = array();
		foreach($rows as $row)
		{
			$versions = array();
			foreach(explode("\t", $row['Versions']) as $version)
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

	public function FillInstitution($row)
	{
		$this->Institution = new InstitutionInfo();
		$this->Institution->Fill($row);
	}

	public function FillStartup($row)
	{
		$this->Startup = new StartupInfo();
		$this->Startup->Fill($row);

		if ($row['wst_center_lat'] !== null && $row['wst_center_lon'] !== null)
		{
			$this->Startup->Center = ['Lat' => $row['wst_center_lat'], 'Lon' => $row['wst_center_lon']];
		}
	}
}



