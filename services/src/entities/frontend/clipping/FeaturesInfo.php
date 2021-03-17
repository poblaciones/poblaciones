<?php

namespace helena\entities\frontend\clipping;

use helena\classes\GlobalTimer;
use helena\entities\BaseMapModel;
use helena\classes\GeoJson;
use minga\framework\Profiling;
use helena\db\frontend\SpatialConditions;
use helena\classes\SimplifyGeometry;

class FeaturesInfo extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;
	public $Data = array();
	public $Gradient = null;
	public $Page = 0;
	public $TotalPages = 0;

	public static function FromRows($rows, $getCentroids, $project = false, $zoom = null, $hasCaption = false)
	{
		Profiling::BeginTimer();
		$ret = new FeaturesInfo();
		$render = new GeoJson();
		$ret->Data = $render->GenerateFromBinary($rows, $getCentroids, $project, $hasCaption);
		if ($zoom !== null && $ret->Data !== null)
		{
			$ret->Data['features'] = self::SimplifyCollection($ret->Data['features'], $zoom);
		}
		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		Profiling::EndTimer();
		return $ret;
	}

	public static function SimplifyCollection($fullFeatures, $zoom)
	{
		Profiling::BeginTimer();
		$simplifier = new SimplifyGeometry();
		$simplifier->discardOversimplified = false;

		$rZoom = SpatialConditions::ResolveRZoom($zoom);
		$features = [];
		for($n = 0; $n < sizeof($fullFeatures); $n++)
		{
			$feature = $fullFeatures[$n];
			$simpler = $simplifier->Simplify($feature['geometry'], $rZoom);
			if ($simpler !== null)
			{
				$feature['geometry'] = $simpler;
				$features[] = $feature;
			}
		}
		Profiling::EndTimer();
		return $features;
	}
}


