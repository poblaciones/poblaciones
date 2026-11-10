<?php

namespace helena\services\wfs;

// Lectura de la cadena de consulta de una solicitud WFS.
// Los parámetros OGC no distinguen mayúsculas: QGIS manda TYPENAMES, otros clientes typenames.
class WfsRequest
{
	public static function Get($name)
	{
		foreach ($_GET as $key => $value)
		{
			if (strcasecmp($key, $name) === 0 && is_string($value))
				return trim($value);
		}
		return null;
	}

	public static function GetInt($name, $default)
	{
		$value = self::Get($name);
		if ($value === null || is_numeric($value) == false)
			return $default;
		return (int) $value;
	}

	public static function GetTypeNames()
	{
		$value = self::Get('typenames');
		if ($value === null)
			$value = self::Get('typename');
		return $value;
	}

	public static function GetOutputFormat()
	{
		$value = self::Get('outputformat');
		if ($value === null)
			return null;
		return strtolower($value);
	}

	// WFS define 'results' (por defecto) y 'hits'. QGIS pide 'hits' para contar entidades.
	public static function IsHits()
	{
		$value = self::Get('resulttype');
		return $value !== null && strtolower($value) === 'hits';
	}

	// Devuelve [minLon, minLat, maxLon, maxLat], o null si no hay BBOX.
	//
	// Sin un CRS explícito como quinto valor, el orden de ejes es el del CRS por defecto
	// del tipo (EPSG:4326 en forma URN): latitud, longitud. Solo EPSG:4326 en su forma
	// corta y CRS84 declaran longitud, latitud.
	public static function GetBbox()
	{
		$raw = self::Get('bbox');
		if ($raw === null || $raw === '')
			return null;

		$parts = explode(',', $raw);
		if (count($parts) < 4)
			return null;
		for ($n = 0; $n < 4; $n++)
		{
			if (is_numeric(trim($parts[$n])) == false)
				return null;
		}
		$first = (float) $parts[0];
		$second = (float) $parts[1];
		$third = (float) $parts[2];
		$fourth = (float) $parts[3];

		$lonLatOrder = false;
		if (count($parts) > 4)
		{
			$crs = strtoupper(trim($parts[4]));
			$lonLatOrder = ($crs === 'EPSG:4326' || substr($crs, -6) === ':CRS84');
		}

		if ($lonLatOrder)
			return [$first, $second, $third, $fourth];
		return [$second, $first, $fourth, $third];
	}
}
