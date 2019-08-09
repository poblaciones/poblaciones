<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class GeographyCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Geographies/Features");
	}
	public static function CreateKey($x, $y, $zoom, $b)
	{
		$key = 'x' . $x . "y" . $y . "z" . $zoom;
		if ($b != null)
			$key .= 'b' . $b;
		return $key;
	}
}

