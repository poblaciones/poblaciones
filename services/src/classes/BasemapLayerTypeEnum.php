<?php

namespace helena\classes;

abstract class BasemapLayerTypeEnum
{
	const Raster = "R";
	const Metric = "M";
	const Boundary = "B";
	const Labels = "L";

	// Estado inicial de una capa en una cartografía que no lo configuró.
	public static function IsActiveByDefault($type)
	{
		return ($type === self::Labels);
	}
}
