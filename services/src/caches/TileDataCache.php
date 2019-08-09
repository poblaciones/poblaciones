<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class TileDataCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Metrics/GeoData");
	}
	public static function CreateKey($frame, $metricVersionId, $levelId, $x, $y,$zoom, $b)
	{
		$key = $frame->GetKeyNoFeature() . "@" .  $metricVersionId . "@" . $levelId . "@x" . $x . "y" . $y . "z" . $zoom;
		if ($b != null)
			$key .= 'b' . $b;
		return $key;
	}
}

