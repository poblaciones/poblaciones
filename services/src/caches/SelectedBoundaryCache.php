<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class SelectedBoundaryCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Boundaries/Selected");
	}
	public static function CreateKey($id)
	{
		$key = $id;
		return $key;
	}
}

