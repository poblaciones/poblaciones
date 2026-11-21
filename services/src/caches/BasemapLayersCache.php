<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class BasemapLayersCache extends BaseCache
{
	const CONFIGURATION_KEY = 'configuration';

	public static function Cache()
	{
		return new ObjectCache("Map/BasemapLayers");
	}
}
