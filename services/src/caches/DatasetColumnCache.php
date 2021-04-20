<?php

namespace helena\caches;

use minga\framework\caching\TwoLevelObjectCache;

class DatasetColumnCache extends BaseCache
{
	public static function Cache()
	{
		return new TwoLevelObjectCache("Datasets/ColumnDistributions");
	}
	public static function CreateKey($dataColumn, $dataColumnId, $normalization, $normalizationId, $normalizationScale, $from, $to, $filter)
	{
		$key = "c" . $dataColumn;
		if ($dataColumnId !== null)
			$key .= "i" . $dataColumnId;
		$key .= "n" . $normalization;
		if ($normalizationId !== null)
			$key .= "i" . $normalizationId;
		$key .= "e" . $normalizationScale;
		$key .= "f" . $from . "t" . $to;
		if ($filter !== null)
		{
			if (strlen($filter) > 30)
				$filterData = mhash(MHASH_MD4, $filter);
			else
				$filterData = $filter;
			$key .= "f" . bin2hex($filterData);
		}
		return $key;
	}
}

