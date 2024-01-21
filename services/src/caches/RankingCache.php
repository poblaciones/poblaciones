<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class RankingCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Metrics/Ranking");
	}
	public static function CreateKey($frame, $metricVersionId, $levelId, $compareLevelId, $size, $direction, $urbanity, $partition, $hasTotals, $hiddenValueLabels)
	{
		$ret = $frame->GetSummaryKey() . "@" . $metricVersionId . "@" . $levelId . "@" . $compareLevelId
									. "@" . $size
									. "@" . $direction . "@" . ($urbanity ?  $urbanity : '') . "@" . $hasTotals
									. "@" . ($partition !== null ?  $partition : '')
									. "@" . ($hiddenValueLabels ?  implode('-', $hiddenValueLabels) : '');

		return $ret;
	}
}

