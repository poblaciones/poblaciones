<?php

namespace helena\services\backoffice\metrics;

use minga\framework\PublicException;
use minga\framework\Profiling;

// Migrated from:
// https://github.com/geotools/geotools/blob/0e6fc022f395194e7670b63d2de785123a178cdf/modules/library/main/src/main/java/org/geotools/filter/function/JenksNaturalBreaksFunction.java
// Los datos deben estar ordenados
class NtilesBreaks
{
	const DATA = 0;
	const WEIGHT = 1;

	public static function Calculate(array $dataWeighted, $classes, $totalPopulation)
	{
		Profiling::BeginTimer("NtilesBreaks->Calculate->" . $classes);
		if (count($dataWeighted) < $classes)
		{
			$ret = self::CreateMinimalList(self::GetKeys($dataWeighted), $classes);
			Profiling::EndTimer();
			return $ret;
		}
		// Ahora itera por la lista ordenada armando las clases
		$ret = [];
		$cutInterval = $totalPopulation / $classes;
		$nextCutPoint = $cutInterval;
		$cummulatedSum = 0;
		$lastItemValue = $dataWeighted[0][self::DATA];
		foreach ($dataWeighted as $item)
		{
			if ($cummulatedSum >= $nextCutPoint && $lastItemValue != $item[self::DATA])
			{
				$ret[] = $item[self::DATA];
				$nextCutPoint += $cutInterval;
			}
			$lastItemValue = $item[self::DATA];
			// Arrastra la suma acumulada
			$cummulatedSum += $item[self::WEIGHT];
		}
		Profiling::EndTimer();
		return $ret;
	}

	public static function GetKeys(array $dataWeighted)
	{
		$ret = [];
		foreach($dataWeighted as $item)
			$ret[] = $item[self::DATA];
		return $ret;
	}

	public static function CalculateTotalPopulation(array $dataWeighted)
	{
		Profiling::BeginTimer();
		$totalPopulation = 0;
		foreach ($dataWeighted as $data)
		{
			$weight = $data[self::WEIGHT];
			if ($weight !== null)
			{
				// precalcula el total poblacional
				$totalPopulation += $weight;
			}
		}
		Profiling::EndTimer();
		return $totalPopulation;
	}

	public static function CreateMinimalList(array $data, $classes)
	{
		$max = min($classes  - 1, count($data));
		$lst = [];
		if ($max == 0)
			return $lst;
		for ($i = 0; $i < $max; $i++)
			$lst[] = $data[$i];
		return $lst;
	}

}
