<?php

namespace helena\entities\frontend\clipping;

use helena\classes\GlobalTimer;
use helena\entities\BaseMapModel;
use helena\classes\GeoJson;

class FeaturesInfo extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;
	public $Data = array();

	public static function FromRows($rows, $getCentroids, $project = false)
	{
		$ret = new FeaturesInfo();
		$render = new GeoJson();
		$ret->Data = $render->GenerateFromBinary($rows, $getCentroids, $project);
		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		return $ret;
	}
}


