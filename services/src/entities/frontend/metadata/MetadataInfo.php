<?php

namespace helena\entities\frontend\metadata;

use helena\entities\BaseMapModel;

class MetadataInfo extends BaseMapModel
{
	public $Id;
	public $Caption;
	public $Date;
	public $Institution;
	public $Abstract;
	public $Authors;
	public $License;

	public static function GetMap()
	{
		return array (
			'met_id' => 'Id',
			'met_title' => 'Caption',
			'met_abstract' => 'Abstract',
			'met_publication_date' => 'Date',
			'met_license' => 'License',
			'ins_caption' => 'Institution',
			'met_authors' => 'Authors');
	}

}


