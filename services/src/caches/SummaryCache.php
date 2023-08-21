<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class SummaryCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Metrics/Summary");
	}
	public static function CreateKey($frame, $metricVersionId, $levelId, $compareLevelId = '0', $urbanity, $partition)
	{
		return $frame->GetSummaryKey() . "@" . $metricVersionId . "@" . $levelId . "@" . $compareLevelId . "@" . ($urbanity ?  $urbanity : '') . ($partition !== null ?  "@" . $partition : '');
	}
}

