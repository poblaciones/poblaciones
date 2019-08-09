<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class MetricVersionInfo extends BaseMapModel
{
	public $Id;
	public $Name;

	public $PartialCoverage;
	public $Work;
	public $WorkId;

	public static function GetMap()
	{
		return array (
			'mvr_id' => 'Id',
			'mvr_caption' => 'Name',
			'mvr_partial_coverage' => 'PartialCoverage',
			'met_title' => 'Work',
			'wrk_id' => 'WorkId');
	}
}


