<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class RankingCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Metrics/Ranking");
	}
	public static function CreateKey($frame, $metricVersionId, $levelId, $size, $direction, $urbanity, $hasTotals)
	{
		return $frame->GetSummaryKey() . "@" . $metricVersionId . "@" . $levelId . "@" . $size . "@" . $direction . "@" . ($urbanity ?  $urbanity : '') . "@" . $hasTotals;
	}
}

