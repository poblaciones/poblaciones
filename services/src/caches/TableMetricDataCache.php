<?php

namespace helena\caches;

use helena\classes\App;

use minga\framework\caching\TwoLevelObjectCache;

class TableMetricDataCache extends BaseCache
{
	public static function Cache()
	{
		$limitMB = App::Settings()->ServiceCache()->TileDataCachePerFileLimitMB;
		return new TwoLevelObjectCache("Metrics/TableMetricData", false, $limitMB);
	}
	public static function CreateKey($metricId, $metricVersionId, $levelId, $partition)
	{
		$key = $metricVersionId . "@" . $levelId  . ($partition !== null ?  "@" . $partition : '');
		return $key;
	}
}

