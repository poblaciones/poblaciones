<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class ClippingLevelInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Revision;
	public $Metadata;
	public $MinZoom;
	public $MaxZoom;
	public $PartialCoverage;

	public static function GetMap()
	{
		return array (
			'geo_id' => 'Id',
			'geo_caption' => 'Name',
			'geo_revision' => 'Revision',
			'geo_min_zoom' => 'MinZoom',
			'geo_max_zoom' => 'MaxZoom',
			'geo_partial_coverage' => 'PartialCoverage');
	}

}


