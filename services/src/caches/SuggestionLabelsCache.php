<?php

namespace helena\caches;

use minga\framework\caching\StringCache;

class SuggestionLabelsCache extends BaseCache
{
	public static function Cache()
	{
		return new StringCache("Suggestions/Labels");
	}

	public static function CreateKey($type, $id)
	{
		$key = $type . "#" . $id;
		return $key;
	}
}

