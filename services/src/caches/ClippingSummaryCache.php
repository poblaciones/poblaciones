<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class ClippingSummaryCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Clippings/Summary");
	}
}

