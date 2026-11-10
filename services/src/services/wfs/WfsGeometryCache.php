<?php

namespace helena\services\wfs;

use helena\classes\GeoJson;
use helena\entities\frontend\geometries\Geometry;
use minga\framework\Context;
use minga\framework\settings\CacheSettings;

// Gestiona el caché SQLite de geometrías.
// Para tipo D (censal): archivos geom_geo_{geographyId}.sqlite
// Para tipo S (shapes propios): archivos geom_ds_{datasetId}.sqlite
// Esquema: geography_item_id INTEGER PRIMARY KEY, name TEXT, wkt TEXT,
//          bbox_min_lat REAL, bbox_max_lat REAL, bbox_min_lon REAL, bbox_max_lon REAL
class WfsGeometryCache
{
	private $sourceKey; // "geo_{geographyId}" o "ds_{datasetId}"
	private $db;

	public function __construct($datasetType, $geographyIdOrDatasetId)
	{
		if ($datasetType === WfsDatasetType::CENSUS)
			$this->sourceKey = "geo_{$geographyIdOrDatasetId}";
		else
			$this->sourceKey = "ds_{$geographyIdOrDatasetId}";
	}

	private function GetPath()
	{
		return WfsConfig::GetSqliteCacheDir() . "/geom_{$this->sourceKey}.sqlite";
	}

	private function GetDb()
	{
		if ($this->db !== null)
			return $this->db;
		$this->db = new \SQLite3($this->GetPath());
		$this->db->enableExceptions(true);
		$this->db->exec('PRAGMA journal_mode=WAL');
		return $this->db;
	}

	public function IsPopulated()
	{
	/*	if (Context::Settings()->Cache()->Enabled !== CacheSettings::Enabled)
			return false;
*/
		$path = $this->GetPath();
		if (!is_file($path))
			return false;
		try
		{
			$db  = $this->GetDb();
			$row = $db->querySingle('SELECT count(*) as n FROM geom', true);
			return $row && (int)$row['n'] > 0;
		}
		catch (\Exception $e)
		{
			return false;
		}
	}

	public function Populate($geojsonFeatures)
	{
		$db = $this->GetDb();
		$db->exec('DROP TABLE IF EXISTS geom');
		$db->exec('CREATE TABLE geom (
			geography_item_id INTEGER PRIMARY KEY,
			name TEXT,
			wkt  TEXT,
			geojson TEXT,
			bbox_min_lat REAL,
			bbox_max_lat REAL,
			bbox_min_lon REAL,
			bbox_max_lon REAL
		)');

		$stmt = $db->prepare(
			'INSERT INTO geom VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
		);

		$db->exec('BEGIN');
		foreach ($geojsonFeatures as $feature)
		{
			$geometry = GeoJson::LoadBinaryGeometry($feature['value']);
			$gid      = $feature['FID'];
			$name     = $feature['Description'] ?? '';
			$wkt      = $geometry->ToWkt();
			$geojson  = $geometry->ToGeoJson();
			$bbox     = $geometry->GetBBox();

			$stmt->bindValue(1, $gid);
			$stmt->bindValue(2, $name);
			$stmt->bindValue(3, $wkt);
			$stmt->bindValue(4, $geojson);
			$stmt->bindValue(5, $bbox['miny']);
			$stmt->bindValue(6, $bbox['maxy']);
			$stmt->bindValue(7, $bbox['minx']);
			$stmt->bindValue(8, $bbox['maxx']);
			$stmt->execute();
			$stmt->reset();
		}
		$db->exec('COMMIT');
	}

	// Devuelve geometrías para los geography_item_ids dados (caso con BBOX, IDs vienen de MySQL)
	public function GetByIds($ids)
	{
		if (empty($ids))
			return [];
		$db     = $this->GetDb();
		$idList = implode(',', array_map('intval', $ids));
		$result = $db->query(
			"SELECT geography_item_id, name, wkt, geojson FROM geom
			 WHERE geography_item_id IN ({$idList})
			 ORDER BY geography_item_id ASC"
		);
		return $this->FetchAll($result);
	}

	// Devuelve todas las geometrías filtradas por BBOX (para Shapes/Boundaries sin MySQL)
	public function GetByBbox($minLat, $maxLat, $minLon, $maxLon)
	{
		$db     = $this->GetDb();
		$result = $db->query(
			"SELECT geography_item_id, name, wkt, geojson FROM geom
			 WHERE bbox_max_lat >= {$minLat} AND bbox_min_lat <= {$maxLat}
			   AND bbox_max_lon >= {$minLon} AND bbox_min_lon <= {$maxLon}
			 ORDER BY geography_item_id ASC"
		);
		return $this->FetchAll($result);
	}

	// Devuelve todo (caso sin BBOX)
	public function GetAll()
	{
		$db     = $this->GetDb();
		$result = $db->query('SELECT geography_item_id, name, wkt, geojson FROM geom ORDER BY geography_item_id ASC');
		return $this->FetchAll($result);
	}

	private function FetchAll($result)
	{
		$rows = [];
		while ($row = $result->fetchArray(SQLITE3_ASSOC))
			$rows[] = $row;
		return $rows;
	}

	public function Close()
	{
		if ($this->db !== null)
		{
			$this->db->close();
			$this->db = null;
		}
	}

	private static function RingsToWkt($rings)
	{
		$parts = [];
		foreach ($rings as $ring)
		{
			$pts    = array_map(fn($c) => "{$c[0]} {$c[1]}", $ring);
			$parts[] = '(' . implode(', ', $pts) . ')';
		}
		return implode(', ', $parts);
	}

	public static function GeojsonGeomBbox($geom)
	{
		if ($geom === null)
			return [null, null, null, null];
		$coords = [];
		self::CollectCoords($geom['coordinates'] ?? [], $coords);
		if (empty($coords))
			return [null, null, null, null];
		$lats = array_column($coords, 1);
		$lons = array_column($coords, 0);
		return [min($lats), max($lats), min($lons), max($lons)];
	}

	private static function CollectCoords($val, &$out)
	{
		if (empty($val))
			return;
		if (is_numeric($val[0]))
			$out[] = $val;
		else
			foreach ($val as $sub)
				self::CollectCoords($sub, $out);
	}
}
