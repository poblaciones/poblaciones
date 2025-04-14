<?php

namespace helena\entities\frontend\work;

use helena\entities\BaseMapModel;
use helena\classes\GeoJson;

class WorkInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Metadata;
	public $IsPrivate;
	public $CanEdit;
	public $Extents;
	public $Url;
	public $FileUrl;
	public $Annotations;
	public $Metrics;
	public $Startup;
	public $Onboarding;
	public $ArkUrl;

	public static function GetMap()
	{
		return array (
			'wrk_id' => 'Id',
			'met_url' => 'Url',
			'wrk_type' => 'Type',
			'wrk_is_private' => 'IsPrivate'
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
			$localVersions = array();
			foreach(explode("\t", $row['LocalVersions']) as $version)
				$localVersions[] = array('Name' => $version);
			$arr[] = array('Id' => $row['Id'], 'Name' => $row['Name'], 'Versions' => $versions, 'LocalVersions' => $localVersions);

		}
		$this->Metrics = $arr;
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

	public function FillOnboarding($rows)
	{
		$this->Onboarding = new OnboardingInfo();
		if (sizeof($rows) == 0)
			return;
		$this->Onboarding->Fill($rows[0]);
		$this->Onboarding->Enabled = 1;
		$this->Onboarding->FillSteps($rows);
	}
}



