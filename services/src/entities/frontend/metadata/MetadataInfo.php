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
	public $Institution;
	public $Abstract;
	public $Coverage;
	public $License;
	public $Files;

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
			//'met_url' => 'Url',
			'met_coverage_caption' => 'Coverage'/*,
			'ins_caption' => 'Institution',
			'ins_watermark_id' => 'WatermarkId',
			'ins_color' => 'PrimaryColor',*/);
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

}


