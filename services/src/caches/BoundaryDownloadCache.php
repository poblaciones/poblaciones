<?php

namespace helena\caches;

use minga\framework\caching\FileFileCache;
use minga\framework\Str;

class BoundaryDownloadCache extends BaseCache
{
	public static function Cache()
	{
		return new FileFileCache("Boundaries/Downloads");
	}
	public static function CreateKey($type, $boundaryId, $clippingItemId, $clippingCircle)
	{
		$key = $type . "b" . $boundaryId .  "r" . Str::JoinInts($clippingItemId, '-');
		if ($clippingCircle)
			$key .= "c" . $clippingCircle->TextSerialize();
		return $key;
	}
	public static function Clear($boundaryId)
	{
		self::Cache()->Clear($boundaryId);
	}
}

