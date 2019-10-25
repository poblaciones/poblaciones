<?php

namespace helena\entities\frontend\clipping;

use helena\classes\GlobalTimer;
use helena\entities\BaseMapModel;
use helena\classes\GeoJson;
use minga\framework\Profiling;

class FeaturesInfo extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;
	public $Data = array();
	public $Page = 0;
	public $TotalPages = 0;

	public static function FromRows($rows, $getCentroids, $project = false)
	{
		Profiling::BeginTimer();
		$ret = new FeaturesInfo();
		$render = new GeoJson();
		$ret->Data = $render->GenerateFromBinary($rows, $getCentroids, $project);
		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		Profiling::EndTimer();
		return $ret;
	}
}


