<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class DatasetShapesCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Datasets/Shapes");
	}
	public static function CreateKey($x, $y,$zoom)
	{
		$key = "x" . $x . "y" . $y . "z" . $zoom;
		return $key;
	}
}

