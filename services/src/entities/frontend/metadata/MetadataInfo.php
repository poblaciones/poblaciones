<?php

namespace helena\entities\frontend\metadata;

use helena\entities\BaseMapModel;

class MetadataInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Authors;
	public $Date;
	public $ReleaseDate;
	public $Institutions;
	public $Abstract;
	public $Coverage;
	public $License;
	public $Files;
	public $Url;

	public static function GetMap()
	{
		return array (
			'met_id' => 'Id',
			'met_title' => 'Name',
			'met_authors' => 'Authors',
			'met_abstract' => 'Abstract',
			'met_publication_date' => 'Date',
			'met_online_since' => 'ReleaseDate',
			'met_license' => 'License',
			'met_coverage_caption' => 'Coverage');
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

	public function FillInstitutions($rows)
	{
		foreach($rows as $row)
		{
			$institution = new InstitutionInfo();
			$institution->Fill($row);
			$this->Institutions[] = $institution;
		}
	}
}


