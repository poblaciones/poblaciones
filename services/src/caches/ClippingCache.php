<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;
use minga\framework\Str;

class ClippingCache extends BaseCache
{
	public static function CreateKey($frame, $levelId, $name, $urbanity)
	{
		$key = $levelId . "@" . $frame->GetClippingKey();
		if ($urbanity) {
			$key .= "@u-" . $urbanity;
		}
		if ($name !== null) {
			$key .= "@" . Str::UrlencodeFriendly($name);
		}
		return $key;
	}

	public static function Cache()
	{
		return new ObjectCache("Clippings/Data");
	}
}

