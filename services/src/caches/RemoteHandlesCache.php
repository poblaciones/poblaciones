<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;

class RemoteHandlesCache extends BaseCache
{
	public static function Cache()
	{
		return new ObjectCache("Remote/Handles");
	}
	public static function CreateKey($url, $isTextVersion)
	{
		$key = urlencode($url) . "#" . ($isTextVersion ? "T" : "M");
		return $key;
	}
}

