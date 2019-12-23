<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class WorkVisiblityCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Works/Visiblity");
	}
}

