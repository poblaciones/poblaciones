<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelFileFileCache;

class BackofficeDownloadCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelFileFileCache("Datasets/BackofficeDownloads");
	}
	public static function CreateKey($type)
	{
		$key = $type;
		return $key;
	}
	public static function Clear($datasetId)
	{
		self::Cache()->Clear($datasetId);
	}
}

