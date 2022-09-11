<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class LayerDataCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Metrics/LayerData");
	}
	public static function CreateKey($frame, $metricVersionId, $levelId, $urbanity)
	{
		$key = $frame->GetKeyNoFeature() . "@" .  $metricVersionId . "@" . $levelId  . "@" .  ($urbanity ?  $urbanity : '');
		return $key;
	}
}

