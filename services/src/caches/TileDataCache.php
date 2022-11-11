<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class TileDataCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Metrics/TileData");
	}
	public static function CreateKey($frame, $metricVersionId, $levelId, $urbanity, $partition, $x, $y,$zoom)
	{
		$key = $frame->GetKeyNoFeature() . "@" .  $metricVersionId . "@" . $levelId  . "@" .  ($urbanity ?  $urbanity : '') . "@x" . $x . "y" . $y . "z" . $zoom . ($partition !== null ?  "@" . $partition : '');
		return $key;
	}
}

