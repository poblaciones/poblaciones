<?php

namespace helena\services\wfs;

use minga\framework\IO;

class WfsSelectedMetricCache
{
	private static function GetPath($metricId)
	{
		return WfsConfig::GetSqliteCacheDir() . "/meta_{$metricId}.json";
	}

	// Devuelve el metadato, usando caché si existe o haciendo fetch si no.
	// Usado por WfsLayerDescriptor cuando llega un GetFeature o DescribeFeatureType
	// para una métrica individual (sin pasar por el flujo batch de GetCapabilities).
	public static function Get($metricId)
	{
		$cached = self::GetCached($metricId);
		if ($cached !== null)
			return $cached;
		return self::Fetch($metricId);
	}

	// Devuelve la Signature almacenada en caché sin hacer ningún request.
	// Retorna null si no hay caché para esa métrica.
	public static function GetStoredSignature($metricId)
	{
		$path = self::GetPath($metricId);
		if (!is_file($path))
			return null;
		$data = json_decode(IO::ReadAllText($path), true);
		return isset($data['Metric']['Signature']) ? (int)$data['Metric']['Signature'] : null;
	}

	// Devuelve el metadato desde caché local sin hacer ningún request.
	// Solo llamar cuando se sabe que el caché es válido (signature verificada).
	public static function GetCached($metricId)
	{
		$path = self::GetPath($metricId);
		if (!is_file($path))
			return null;
		return json_decode(IO::ReadAllText($path), true);
	}

	// Trae y guarda un único metadato vía GetSelectedMetric.
	public static function Fetch($metricId)
	{
		$data = WfsRemoteClient::GetSelectedMetric($metricId);
		if ($data === null)
			return null;
		self::Store($metricId, $data);
		return $data;
	}

	// Recibe un array de metricIds que necesitan refresh y los trae en batches
	// via GetSelectedInfos (un solo request por batch de BATCH_SIZE).
	// Guarda cada resultado en su archivo de caché individual.
	public static function FetchBatch($metricIds)
	{
		if (empty($metricIds))
			return;

		$chunks = array_chunk($metricIds, WfsConfig::BATCH_SIZE);
		foreach ($chunks as $chunk)
		{
			$list    = implode(',', $chunk);
			$results = WfsRemoteClient::GetSelectedInfos($list);
			if (!is_array($results))
				continue;
			foreach ($results as $data)
			{
				$mid = $data['Metric']['Id'] ?? null;
				if ($mid !== null)
					self::Store($mid, $data);
			}
		}
	}

	private static function Store($metricId, $data)
	{
		IO::WriteAllText(self::GetPath($metricId), json_encode($data));
	}

	// Fuerza refresh individual (cuando WfsDataCache detecta Signature diferente en datos)
	public static function Invalidate($metricId)
	{
		$path = self::GetPath($metricId);
		if (is_file($path))
			IO::Delete($path);
	}
}
