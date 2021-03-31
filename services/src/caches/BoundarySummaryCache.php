<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class BoundarySummaryCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Boundaries/Summary");
	}
	public static function CreateKey($frame)
	{
		return $frame->GetSummaryKey();
	}
}

