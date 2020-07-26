<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelFileFileCache;

class DownloadCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelFileFileCache("Datasets/Downloads");
	}
	public static function CreateKey($type, $clippingItemId, $clippingCircle, $urbanity)
	{
		$key = $type . "r" . $clippingItemId;
		if ($urbanity)
			$key .= "u" . $urbanity;
		if ($clippingCircle)
			$key .= "c" . $clippingCircle->TextSerialize();
		return $key;
	}
	public static function Clear($datasetId)
	{
		self::Cache()->Clear($datasetId);
	}
}

