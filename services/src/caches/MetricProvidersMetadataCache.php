<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class MetricProvidersMetadataCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("MetricProviders/Metadata");
	}
}

