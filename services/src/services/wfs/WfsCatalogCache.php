<?php

namespace helena\services\wfs;

use minga\framework\IO;

class WfsCatalogCache
{
	private static function GetCatalogPath()
	{
		return WfsConfig::GetSqliteCacheDir() . '/catalog.json';
	}

	public static function GetCatalog()
	{
		$path = self::GetCatalogPath();

		if (is_file($path) && (time() - filemtime($path)) < WfsConfig::TTL_CATALOG_SECONDS)
			return json_decode(IO::ReadAllText($path), true);

		$metrics = WfsRemoteClient::GetFabIndicators();
		$boundaries = WfsRemoteClient::GetFabBoundaryVersions();
		if ($metrics === null || $boundaries === null)
			return null;

		$data = ['Metrics' => $metrics, 'Boundaries' => $boundaries];

		IO::WriteAllText($path, json_encode($data));
		return $data;
	}
}
