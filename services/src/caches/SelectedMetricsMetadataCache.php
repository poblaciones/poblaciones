<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class SelectedMetricsMetadataCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Metrics/SelectedMetric", true);
	}
}

