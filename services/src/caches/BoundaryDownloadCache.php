<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelFileFileCache;
use minga\framework\Str;

class BoundaryDownloadCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelFileFileCache("Boundaries/Downloads");
	}
	public static function CreateKey($type, $boundaryId)
	{
		$key = $type . "b" . $boundaryId;
		return $key;
	}
	public static function Clear($datasetId)
	{
		self::Cache()->Clear($datasetId);
	}
}

