<?php

namespace helena\classes;

use minga\framework\IO;
use minga\framework\Arr;

class LevelZoom
{
	public static function RemoveZoomHoles($selectedVersionInfo)
	{
		// Recorre los levels quitando límites de zoom no cubiertos
		// Tiene que haber de 0 a 22
		// Cada level tiene un MaxZoom y un MinZoom (ej. MinZoom: 12, MaxZoom: 14)
		// Expande los MinZoom primero si tiene, para corregir.
		$totalRange = new \stdClass();
		$totalRange->MinZoom = 0;
		$totalRange->MaxZoom = 22;
		$missingRanges = self::removeRanges(array($totalRange), $selectedVersionInfo->Levels);
		self::MergeUpRanges($selectedVersionInfo->Levels, $missingRanges);
	}

	private static function removeRanges($ranges, $toRemoveRanges)
	{
		foreach($toRemoveRanges as $toRemoveRange)
		{
			// Se fija si está dentro de algún range
			$remainingParts = array();
			foreach($ranges as $container)
			{
				if (self::containsRange($container, $toRemoveRange))
				{
					// agrega los dos bloques resultantes si tienen length > 0
					$lower = new \stdClass();
					$lower->MinZoom = $container->MinZoom;
					$lower->MaxZoom = $toRemoveRange->MinZoom - 1;
					$upper = new \stdClass();
					$upper->MinZoom = $toRemoveRange->MaxZoom + 1;
					$upper->MaxZoom = $container->MaxZoom;
					if ($lower->MaxZoom - $lower->MinZoom > 0)
						$remainingParts[] = $lower;
					if ($upper->MaxZoom - $upper->MinZoom > 0)
						$remainingParts[] = $upper;
				}
				else
				{
					$remainingParts[] = $container;
				}
			}
			$ranges = $remainingParts;
		}
		return $ranges;
	}

	private static function containsRange($container, $item)
	{
		return $item->MinZoom >= $container->MinZoom && $item->MaxZoom <= $container->MaxZoom;
	}

	private static function MergeUpRanges($levels, $missingRanges)
	{
		foreach($missingRanges as $missingRange)
		{
			$lower = null;
			$upper = null;
			foreach($levels as $level)
			{
				// Se fija para cada missingRange cuáles son los adyacentes
				if ($level->MinZoom - 1 === $missingRange->MaxZoom)
					$lower = $level;
				if ($level->MaxZoom + 1 === $missingRange->MinZoom)
					$upper = $level;
			}
			// Expande el inferior
			if ($lower !== null)
				$lower->MinZoom = $missingRange->MinZoom;
			else
				$upper->MaxZoom = $missingRange->MaxZoom;
		}
	}
}