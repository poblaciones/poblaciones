<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class LabelsCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Geographies/Labels");
	}
	public static function CreateKey($x, $y, $zoom, $b)
	{
		$key = 'x' . $x . "y" . $y . "z" . $zoom;
		if ($b != null)
			$key .= 'b' . $b;
		return $key;
	}

	public static function CreateBlockKey($x, $y, $zoom, $size, $b)
	{
		$key = 'x' . $x . "y" . $y . "z" . $zoom . "s" . $size;
		if ($b != null)
			$key .= 'b' . $b;
		return $key;
	}
}

