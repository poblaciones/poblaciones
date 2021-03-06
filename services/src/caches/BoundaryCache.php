<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class BoundaryCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Boundaries/Features");
	}
	public static function CreateKey($frame)
	{
		$key = $frame->GetClippingKey() . $frame->GetTileKey();
		return $key;
	}
}

