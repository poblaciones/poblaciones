<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class SummaryCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Metrics/Summary");
	}
	public static function CreateKey($frame, $metricVersionId, $levelId, $levelCompareId = '0', $urbanity, $partition)
	{
		return $frame->GetSummaryKey() . "@" . $metricVersionId . "@" . $levelId . "@" . $levelCompareId . "@" . ($urbanity ?  $urbanity : '') . ($partition !== null ?  "@" . $partition : '');
	}
}

