<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelFileFileCache;

class DictionaryMetadataCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelFileFileCache("Metadata/DictionaryCache");
	}
	public static function CreateKey($datasetId)
	{
		return '' . $datasetId;
	}
	public static function Clear($metadataId)
	{
		self::Cache()->Clear($metadataId);
	}
}

