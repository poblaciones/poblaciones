<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class FabMetricsCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Metrics/Fab");
	}
}

