<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class MetricDataCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Metrics/MetricData", true);
	}
	public static function CreateKey($frame, $metricVersionId, $levelId, $urbanity, $partition)
	{
		$key = $frame->GetKeyNoFeature() . "@" .  $metricVersionId . "@" . $levelId  . "@" .  ($urbanity ?  $urbanity : '') . ($partition !== null ?  "@" . $partition : '');
		return $key;
	}
}

