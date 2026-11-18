<?php

namespace helena\services\mcp;

/**
 * Arma la ruta del visor (lo que sigue al '#') para abrir el mapa de un indicador.
 *
 * El formato lo define map/classes/SaveRoute.js: bloques separados por '/'. El de recorte es
 * '&!r<ids de región separados por coma>' y el de indicadores es 'l=<indicador>!v<serie>!a<nivel>!l1!x<partición>'.
 * Serie y nivel son posiciones en las listas que entrega SelectedMetricService (series del indicador y niveles
 * de la serie), no ids; 'l1' fija el nivel para que el visor no lo cambie con el zoom.
 */
class McpMapRoute
{
	public static function BuildMetric(int $indicatorId, ?int $versionPosition, ?int $levelPosition, ?int $partition, bool $pinLevel): string
	{
		$route = strval($indicatorId);
		if ($versionPosition !== null)
			$route .= '!v' . $versionPosition;
		if ($levelPosition !== null)
			$route .= '!a' . $levelPosition;
		if ($levelPosition !== null && $pinLevel)
			$route .= '!l1';
		if ($partition !== null)
			$route .= '!x' . $partition;
		return $route;
	}

	public static function JoinRegionIds(array $regionIds): string
	{
		$ids = [];
		foreach ($regionIds as $regionId)
		{
			$ids[] = intval($regionId);
		}
		return implode(',', $ids);
	}
}
