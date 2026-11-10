<?php

namespace helena\services\wfs;

use minga\framework\Log;

class WfsDataCache
{
	private $metricId;
	private $levelId;
	private $variables; // array de ['Id' => int, 'ShortName' => string]
	private $datasetType;
	private $db;

	public function __construct($metricId, $levelId, $variables, $datasetType)
	{
		$this->metricId = $metricId;
		$this->levelId = $levelId;
		$this->variables = $variables;
		$this->datasetType = $datasetType;
	}

	private function GetPath()
	{
		return WfsConfig::GetSqliteCacheDir() . "/data_{$this->metricId}-{$this->levelId}.sqlite";
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

	// Devuelve true si el caché existe y la Signature coincide
	public function IsValid($signature)
	{
		$path = $this->GetPath();
		if (!is_file($path))
			return false;

		try {
			$db = $this->GetDb();
			$row = $db->querySingle('SELECT signature FROM meta LIMIT 1', true);
			return $row && (int) $row['signature'] === (int) $signature;
		} catch (\Exception $e) {
			return false;
		}
	}

	// Llama a GetMetricData, pivota y almacena en SQLite
	public function Populate($metricId, $versionId, $levelId, $signature)
	{
		$isPoints = ($this->datasetType === WfsDatasetType::POINTS);
		$rows = WfsRemoteClient::GetTableMetricData($metricId, $versionId, $levelId, $isPoints, $signature);
		if ($rows === null)
			return false;

		$this->CreateSchema($signature);
		$this->InsertRows($rows);
		return true;
	}

	private function CreateSchema($signature)
	{
		$db = $this->GetDb();

		$db->exec('DROP TABLE IF EXISTS meta');
		$db->exec('DROP TABLE IF EXISTS data');

		$db->exec('CREATE TABLE meta (signature INTEGER)');
		$db->exec("INSERT INTO meta VALUES ({$signature})");

		$cols = 'geography_item_id INTEGER PRIMARY KEY';
		if ($this->datasetType === WfsDatasetType::POINTS)
			$cols .= ', lat REAL, lon REAL';

		foreach ($this->variables as $var) {
			$vid = (int) $var['Id'];
			$cols .= ", v{$vid}_value REAL, v{$vid}_total REAL, v{$vid}_lid INTEGER";
		}

		$db->exec("CREATE TABLE data ({$cols})");

		if ($this->datasetType === WfsDatasetType::POINTS) {
			$db->exec('CREATE VIRTUAL TABLE data_rtree USING rtree(
				geography_item_id,
				lat_min, lat_max,
				lon_min, lon_max
			)');
		}
	}

	private function InsertRows($rows)
	{
		$db = $this->GetDb();
		$db->exec('BEGIN');

		// Agrupa filas por geography_item_id (el API devuelve long format: una fila por VID)
		$byId = [];
		foreach ($rows as $row) {
			$gid = $row['GeographyItemId'];
			if (!isset($byId[$gid]))
				$byId[$gid] = ['lat' => $row['Lat'] ?? null, 'lon' => $row['Lon'] ?? null, 'vars' => []];
			$byId[$gid]['vars'][$row['VID']] = ['value' => $row['Value'], 'total' => $row['Total'], 'lid' => $row['LID']];
		}

		$isPoints = ($this->datasetType === WfsDatasetType::POINTS);
		$rtreeStmt = $isPoints ? $db->prepare(
			'INSERT INTO data_rtree VALUES (?, ?, ?, ?, ?)'
		) : null;

		// Construye statement INSERT dinámico
		$colNames = ['geography_item_id'];
		if ($isPoints)
			$colNames = array_merge($colNames, ['lat', 'lon']);
		foreach ($this->variables as $var) {
			$vid = (int) $var['Id'];
			$colNames[] = "v{$vid}_value";
			$colNames[] = "v{$vid}_total";
			$colNames[] = "v{$vid}_lid";
		}
		$placeholders = implode(', ', array_fill(0, count($colNames), '?'));
		$colList = implode(', ', $colNames);
		$stmt = $db->prepare("INSERT OR REPLACE INTO data ({$colList}) VALUES ({$placeholders})");

		foreach ($byId as $gid => $entry) {
			$vals = [$gid];
			if ($isPoints) {
				$vals[] = $entry['lat'];
				$vals[] = $entry['lon'];
			}
			foreach ($this->variables as $var) {
				$vid = (int) $var['Id'];
				$varRow = $entry['vars'][$vid] ?? null;
				$vals[] = $varRow ? $varRow['value'] : null;
				$vals[] = $varRow ? $varRow['total'] : null;
				$vals[] = $varRow ? $varRow['lid'] : null;
			}
			foreach ($vals as $i => $val)
				$stmt->bindValue($i + 1, $val);
			$stmt->execute();
			$stmt->reset();

			if ($isPoints && $entry['lat'] !== null && $entry['lon'] !== null) {
				$rtreeStmt->bindValue(1, $gid);
				$rtreeStmt->bindValue(2, (float) $entry['lat']);
				$rtreeStmt->bindValue(3, (float) $entry['lat']);
				$rtreeStmt->bindValue(4, (float) $entry['lon']);
				$rtreeStmt->bindValue(5, (float) $entry['lon']);
				$rtreeStmt->execute();
				$rtreeStmt->reset();
			}
		}

		$db->exec('COMMIT');
	}

	// Devuelve filas de datos para una lista de geography_item_ids
	public function GetRowsByIds($ids)
	{
		if (empty($ids))
			return [];
		$db = $this->GetDb();
		$idList = implode(',', array_map('intval', $ids));
		$result = $db->query("SELECT * FROM data WHERE geography_item_id IN ({$idList}) ORDER BY geography_item_id ASC");
		return $this->FetchAll($result);
	}

	// Devuelve todas las filas (cuando no hay BBOX)
	public function GetAllRows()
	{
		$db = $this->GetDb();
		$result = $db->query('SELECT * FROM data ORDER BY geography_item_id ASC');
		return $this->FetchAll($result);
	}

	// Para puntos: filtra por BBOX usando el R*Tree
	public function GetPointsByBbox($minLat, $maxLat, $minLon, $maxLon)
	{
		$db = $this->GetDb();
		$result = $db->query(
			"SELECT d.* FROM data d
			 JOIN data_rtree r ON r.geography_item_id = d.geography_item_id
			 WHERE r.lat_min >= {$minLat} AND r.lat_max <= {$maxLat}
			   AND r.lon_min >= {$minLon} AND r.lon_max <= {$maxLon}
			 ORDER BY d.geography_item_id ASC"
		);
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
		if ($this->db !== null) {
			$this->db->close();
			$this->db = null;
		}
	}
}