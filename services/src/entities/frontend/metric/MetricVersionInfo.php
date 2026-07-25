<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class MetricVersionInfo extends BaseMapModel
{
	public $Id;
	public $Name;

	public $Work;
	public $WorkId;
	public $Levels = [];
	public $WorkIsPrivate = false;

	public static function GetMap()
	{
		return array (
			'mvr_id' => 'Id',
			'mvr_caption' => 'Name',
			'met_title' => 'Work',
			'wrk_id' => 'WorkId');
	}
}


