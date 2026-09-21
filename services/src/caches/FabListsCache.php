<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class FabListsCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Metrics/Fab");
	}
}

