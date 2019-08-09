<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelFileFileCache;

class DownloadCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelFileFileCache("Datasets/Downloads");
	}
	public static function CreateKey($type, $clippingItemId)
	{
		$key = $type . "r" . $clippingItemId;
		return $key;
	}
	public static function Clear($datasetId)
	{
		self::Cache()->Clear($datasetId);
	}
}

