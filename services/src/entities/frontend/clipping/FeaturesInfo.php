<?php

namespace helena\entities\frontend\clipping;

use helena\classes\GlobalTimer;
use helena\entities\BaseMapModel;
use helena\classes\GeoJson;
use minga\framework\Profiling;
use helena\db\frontend\SpatialConditions;
use helena\classes\SimplifyGeometry;
use helena\classes\SimplifyGeometryPlain;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Coordinate;
use helena\classes\ClipperRound;


class FeaturesInfo extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;
	public $Data = array();
	public $Gradient = null;
	public $Page = 0;
	public $TotalPages = 0;

	public static function FromRows($rows, $getCentroids, $project = false, $zoom = null, $hasCaption = false, $projectEnvelope = null)
	{
		Profiling::BeginTimer();
		$ret = new FeaturesInfo();
		$render = new GeoJson();
		$ret->Data = $render->GenerateFromBinary($rows, $getCentroids, $project, $hasCaption, $projectEnvelope);
		if ($zoom !== null && $ret->Data !== null && !$project)
		{
			$ret->Data['features'] = self::SimplifyCollection($ret->Data['features'], $zoom);
		}
		if ($ret->Data !== null && $project)
		{
			$ret->Data['features'] = self::SimplifyCollectionProjected($ret->Data['features'], $zoom);
		}
		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		Profiling::EndTimer();
		return $ret;
	}

	public static function ProcessGeometry(&$rows, $getCentroids, $project = false, $zoom = null, $hasCaption = false, $projectEnvelope = null)
	{
		$geojson = new GeoJson();
		$projectedEnvelope = ($project ? GeoJson::ProjectEnvelope($projectEnvelope) : null);

		$tileEnvelope = new Envelope(new Coordinate(0,0), new Coordinate(GeoJson::TILE_PRJ_SIZE, GeoJson::TILE_PRJ_SIZE));
		$clipper = new ClipperRound();

		for($n = 0; $n < sizeof($rows); $n++)
		{
			$feature = $geojson->GenerateFeatureFromBinary($rows[$n], true, $getCentroids, $project, $hasCaption, $projectedEnvelope);
			$clipped = $clipper->clipCollectionByEnvelope([$feature], $tileEnvelope);
			$rows[$n]['Geometry'] = $clipped[0]['geometry'];
			unset($rows[$n]['value']);
		}
	}

	public static function SimplifyCollectionProjected($fullFeatures, $zoom)
	{
		Profiling::BeginTimer();
		$simplifier = new SimplifyGeometryPlain();
		$simplifier->discardOversimplified = false;

		$features = [];
		for($n = 0; $n < sizeof($fullFeatures); $n++)
		{
			$feature = $fullFeatures[$n];
			$simpler = $simplifier->Simplify($feature['geometry']);
			if ($simpler !== null)
			{
				$feature['geometry'] = $simpler;
				$features[] = $feature;
			}
		}
		Profiling::EndTimer();
		return $features;
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


