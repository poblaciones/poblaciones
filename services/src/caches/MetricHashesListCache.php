<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class MetricHashesListCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Metrics/Hashes/Lists");
	}
}

