<?php

namespace helena\caches;

use minga\framework\caching\StringCache;

class FrameMetricsHashCache extends BaseCache
{
	public static function Cache()
	{
		return new StringCache("Frames/Metrics/Hashes");
	}
}

