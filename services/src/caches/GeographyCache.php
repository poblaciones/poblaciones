<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class GeographyCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Geographies/Features");
	}
	public static function CreateKey($x, $y, $zoom, $page)
	{
		$key = 'x' . $x . "y" . $y . "z" . $zoom . ($page > 0 ? "p" . $page : "");
		return $key;
	}
}

