<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class LabelsCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Geographies/Labels");
	}
	public static function CreateKey($x, $y, $zoom)
	{
		$key = 'x' . $x . "y" . $y . "z" . $zoom;
		return $key;
	}

	public static function CreateBlockKey($x, $y, $zoom, $size)
	{
		$key = 'x' . $x . "y" . $y . "z" . $zoom . "s" . $size;

		return $key;
	}
}

