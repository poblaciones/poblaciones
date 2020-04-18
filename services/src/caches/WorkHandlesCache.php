<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class WorkHandlesCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Works/Handles");
	}
	public static function CreateKey($metricId, $clippingRegionItemId)
	{
		$key = $metricId . "@" . ($clippingRegionItemId ?  $clippingRegionItemId : '');
		return $key;
	}
}

