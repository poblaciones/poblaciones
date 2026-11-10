<?php

namespace helena\services\wfs;

use minga\framework\Context;
use minga\framework\IO;

use helena\classes\App;

class WfsConfig
{
	// Bounding box de Argentina
	const ARG_MIN_LON = -73.58;
	const ARG_MIN_LAT = -55.06;
	const ARG_MAX_LON = -53.63;
	const ARG_MAX_LAT = -21.78;

	// TTLs de caché en segundos
	const TTL_CATALOG_SECONDS = 3600;
	const TTL_DATA_SECONDS    = 86400;
	const TTL_BOUNDARY_SECONDS = 86400;

	// Tamaño de batch para GetSelectedInfos
	const BATCH_SIZE = 20;

	// Namespace WFS propio
	const NAMESPACE_PREFIX = 'pob';

	// Forma URN de EPSG:4326: el orden de ejes es latitud, longitud (en GML y en BBOX).
	const CRS_URN = 'urn:ogc:def:crs:EPSG::4326';

	public static function GetRemoteApiBaseUrl()
	{
		return App::Settings()->Servers()->GetTransactionServer()->publicUrl;
	}

	public static function GetWfsNamespaceUri()
	{
		// o /wfs??
		return self::GetWfsBaseUrl();
	}

	public static function GetWfsBaseUrl()
	{
		$mainServer = App::Settings()->Servers()->Main();
		return $mainServer->publicUrl . '/services/wfs';
	}

	public static function GetSqliteCacheDir()
	{
		$dir =  Context::Paths()->GetStorageCaches() . ('/wfs/sqlite');
		IO::EnsureExists($dir);
		return $dir;
	}
}
