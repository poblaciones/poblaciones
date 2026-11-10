<?php

namespace helena\services\wfs;

use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Coordinate;
use helena\services\frontend\GeographyService;
use helena\db\frontend\SnapshotGeographyItemModel;
use helena\services\frontend\ShapesService;

// Obtiene IDs y geometrías de polígonos censales desde MySQL instanciando los servicios directamente.
// Para tipo CENSUS usa GeographyService.
// Para tipo SHAPES usa ShapesService.
class WfsMysqlGeometry
{
	const ZOOM_QUALITY = 12;

	// Devuelve lista de geography_item_id que intersectan el bbox dado.
	public static function GetIdsByBbox($descriptor, $minLat, $maxLat, $minLon, $maxLon)
	{
		$features = self::FetchFeatures($descriptor, $minLat, $maxLat, $minLon, $maxLon);
		$ids = [];
		foreach ($features as $f)
		{
			$gid = $f['FID'];
			if ($gid !== null)
				$ids[] = (int)$gid;
		}
		return $ids;
	}

	// Devuelve features GeoJSON completos filtrados por bbox.
	public static function FetchFeatures($descriptor, $minLat, $maxLat, $minLon, $maxLon)
	{
		$envelope = new Envelope(
			new Coordinate($minLat, $minLon),
			new Coordinate($maxLat, $maxLon)
		);

		if ($descriptor->DatasetType === WfsDatasetType::CENSUS)
		{
			$service = new SnapshotGeographyItemModel();
			$data    = $service->GetGeographyByEnvelope($descriptor->GeographyId, $envelope, self::ZOOM_QUALITY);
		}
		else // SHAPES
		{
			$service = new ShapesService();
			$data    = $service->GetShapesByEnvelope($descriptor->DatasetId, $envelope);
		}
		return $data;
	}

	// Trae todos los features del nivel geográfico (sin bbox, para popular el caché de geometrías)
	public static function FetchAllFeatures($descriptor)
	{
		return self::FetchFeatures(
			$descriptor,
			WfsConfig::ARG_MIN_LAT, WfsConfig::ARG_MAX_LAT,
			WfsConfig::ARG_MIN_LON, WfsConfig::ARG_MAX_LON
		);
	}
}
