<?php

namespace helena\caches;

use minga\framework\caching\StringCache;

class BoundaryVisiblityCache extends BaseCache
{
	public static function CreateKey($boundaryId, $boundaryVersionId)
	{
		$key = $boundaryId . "@" . $boundaryVersionId;
		return $key;
	}

	public static function Cache()
	{
		return new StringCache("Boundaries/Visiblity", true);
	}
}

