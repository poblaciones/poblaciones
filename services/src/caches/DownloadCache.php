<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelFileFileCache;
use minga\framework\Str;

class DownloadCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelFileFileCache("Datasets/Downloads");
	}
	public static function CreateKey($type, $clippingItemId, $clippingCircle, $urbanity, $partition)
	{
		$key = $type . "r" . Str::JoinInts($clippingItemId, '-');
		if ($urbanity)
			$key .= "u" . $urbanity;
		if ($clippingCircle)
			$key .= "c" . $clippingCircle->TextSerialize();
		if ($partition !== null)
			$key .= "p" . $partition;

		return $key;
	}
	public static function Clear($datasetId)
	{
		self::Cache()->Clear($datasetId);
	}
}

