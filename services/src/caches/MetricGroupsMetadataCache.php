<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class MetricGroupsMetadataCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("MetricGroups/Metadata");
	}
}

