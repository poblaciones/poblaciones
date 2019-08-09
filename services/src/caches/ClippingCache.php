<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class ClippingCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Clippings/Data");
	}
}

