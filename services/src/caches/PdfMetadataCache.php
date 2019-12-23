<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelFileFileCache;

class PdfMetadataCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelFileFileCache("Metadata/PdfMetadata");
	}
	public static function CreateKey($datasetId)
	{
		$key = ($datasetId ? $datasetId : 'default');
		return $key;
	}
	public static function Clear($metadataId)
	{
		self::Cache()->Clear($metadataId);
	}
}

