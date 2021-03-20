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
	public static function CreateKey($type, $boundaryId)
	{
		$key = $type . "b" . $boundaryId;
		return $key;
	}
	public static function Clear($boundaryId)
	{
		self::Cache()->Clear($boundaryId);
	}
}

