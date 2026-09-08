<?php

namespace helena\classes\writers;

use minga\framework\Str;
use minga\framework\PublicException;
use helena\classes\spss\Format;
use helena\classes\writers\metrics\MetricsMetadataExporter;
use helena\classes\writers\metrics\VariableStyleCollector;
use helena\classes\writers\metrics\BoundaryStyleCollector;
use helena\db\frontend\BoundaryDownloadModel;

class GpkgWriter extends BaseWriter
{
	const SRS_ID = 4326;
	const GEOM_COLUMN = 'geom';
	const TABLE_NAME = 'features';

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	public function SaveHeader()
	{
		$db = $this->openDb();
		$this->initGeoPackage($db);
		$this->createFeatureTable($db);
		$db->close();
	}

	public function PageData()
	{
		$rows = $this->GetRowsAndIncrementSlice();
		if (count($rows) === 0)
			return false;

		$db = $this->openDb();
		$db->exec('BEGIN');

		$cols = $this->state->Cols();
		$wktIndex = $this->model->wktIndex;

		if ($wktIndex === -1) {
			$iLat = $this->getColumnByVariable($this->state->Get('latVariable'));
			$iLon = $this->getColumnByVariable($this->state->Get('lonVariable'));
		}

		$colNames = $this->buildColNames($cols, $wktIndex);
		$colList = self::GEOM_COLUMN . ',' . implode(',', $colNames);
		$placeholders = implode(',', array_fill(0, count($colNames) + 1, '?'));
		$stmt = $db->prepare('INSERT INTO ' . self::TABLE_NAME . " ($colList) VALUES ($placeholders)");

		if ($stmt === false)
			throw new PublicException('Error al preparar INSERT en gpkg: ' . $db->lastErrorMsg());

		foreach ($rows as $row) {
			// Normalizar claves a índices 0-based para que $i coincida con $wktIndex
			$rowValues = array_values($row);

			// Geometría
			if ($wktIndex !== -1) {
				$wkt = $rowValues[$wktIndex];
			} else {
				$lon = $this->parseCoord($rowValues[$iLon]);
				$lat = $this->parseCoord($rowValues[$iLat]);
				$wkt = "POINT($lon $lat)";
			}

			$blob = $this->wktToGpkgBlob($wkt);
			$stmt->bindValue(1, $blob, SQLITE3_BLOB);

			// Atributos (la columna WKT se omite: la geometría ya quedó en el blob)
			$paramIdx = 2;
			$i = 0;
			foreach ($cols as $col) {
				if ($i === $wktIndex) {
					$i++;
					continue;
				}

				$value = $rowValues[$i];
				if ($col['format'] == Format::F) {
					$bound = ($value === '' || $value === null)
						? null
						: (float) str_replace(',', '.', $value);
					$stmt->bindValue($paramIdx, $bound, $bound === null ? SQLITE3_NULL : SQLITE3_FLOAT);
				} else {
					$stmt->bindValue($paramIdx, (string) $value, SQLITE3_TEXT);
				}

				$paramIdx++;
				$i++;
			}

			$stmt->execute();
			$stmt->reset();
		}

		$db->exec('COMMIT');
		$db->close();

		$this->state->Increment('index');
		return true;
	}

	public function Flush()
	{
		// GPKG es un único archivo — se escribe directamente en outFile, nada que zipar.
		$db = $this->openDb();
		MetricsMetadataExporter::Export($db, $this->collectStyles());
		$db->close();
	}

	/**
	 * Resuelve, según el tipo de descarga, qué collector arma los estilos a embeber: los límites
	 * (boundaries) se colorean por tipo de ClippingRegion, sin relleno; los datasets, por sus
	 * indicadores asociados.
	 */
	private function collectStyles(): array
	{
		if ($this->state->FromDraft())
			return [];

		if ($this->model instanceof BoundaryDownloadModel)
			return BoundaryStyleCollector::Collect((int)$this->state->Get('boundaryVersionId'), $this->state->Cols())['styles'];

		return VariableStyleCollector::Collect((int)$this->state->Get('datasetId'), $this->state->FromDraft(),
			$this->state->Cols(), $this->resolveGeometryKind())['styles'];
	}

	private function resolveGeometryKind(): string
	{
		if ($this->state->AreSegments())
			return 'line';
		else if ($this->model->wktIndex !== -1)
			return 'fill';
		else
			return 'marker';
	}

	// ── Inicialización del GeoPackage ─────────────────────────────────────────

	private function initGeoPackage(\SQLite3 $db): void
	{
		$db->exec("
			CREATE TABLE IF NOT EXISTS gpkg_spatial_ref_sys (
				srs_name                TEXT    NOT NULL,
				srs_id                  INTEGER NOT NULL PRIMARY KEY,
				organization            TEXT    NOT NULL,
				organization_coordsys_id INTEGER NOT NULL,
				definition              TEXT    NOT NULL,
				description             TEXT
			)
		");

		$db->exec("
			INSERT OR IGNORE INTO gpkg_spatial_ref_sys
				(srs_name, srs_id, organization, organization_coordsys_id, definition, description)
			VALUES (
				'WGS 84',
				4326,
				'EPSG',
				4326,
				'GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]',
				'WGS 84 geographic 2D'
			)
		");

		$db->exec("
			CREATE TABLE IF NOT EXISTS gpkg_contents (
				table_name  TEXT     NOT NULL PRIMARY KEY,
				data_type   TEXT     NOT NULL,
				identifier  TEXT     UNIQUE,
				description TEXT     DEFAULT '',
				last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
				min_x       REAL,
				min_y       REAL,
				max_x       REAL,
				max_y       REAL,
				srs_id      INTEGER  REFERENCES gpkg_spatial_ref_sys(srs_id)
			)
		");

		$db->exec("
			CREATE TABLE IF NOT EXISTS gpkg_geometry_columns (
				table_name        TEXT    NOT NULL,
				column_name       TEXT    NOT NULL,
				geometry_type_name TEXT   NOT NULL,
				srs_id            INTEGER NOT NULL REFERENCES gpkg_spatial_ref_sys(srs_id),
				z                 TINYINT NOT NULL,
				m                 TINYINT NOT NULL,
				PRIMARY KEY (table_name, column_name)
			)
		");
	}

	private function createFeatureTable(\SQLite3 $db): void
	{
		$cols = $this->state->Cols();
		$wktIndex = $this->model->wktIndex;

		// Tipo de geometría
		if ($this->state->AreSegments())
			$geomType = 'MULTILINESTRING';
		elseif ($wktIndex !== -1)
			$geomType = 'GEOMETRY'; // puede ser POLYGON o MULTIPOLYGON
		else
			$geomType = 'POINT';

		// 'fid' es la PK autogenerada por este writer y 'geom' es la columna de geometría;
		// ninguna columna de datos puede llamarse igual. Cualquier colisión con estos nombres,
		// o entre columnas de datos entre sí tras sanitizar, se resuelve con sufijo _1, _2, ...
		$usedNames = [mb_strtolower('fid') => true, mb_strtolower(self::GEOM_COLUMN) => true];

		// Columnas de atributos
		$colDefs = '';
		$i = 0;
		foreach ($cols as $col) {
			if ($i === $wktIndex) {
				$i++;
				continue;
			}

			$safeName = $this->uniqueColName($this->safeColName($col['variable']), $usedNames);
			$usedNames[mb_strtolower($safeName)] = true;
			$this->state->state['cols'][$i]['effectiveVariable'] = $safeName;

			$sqlType = ($col['format'] == Format::F) ? 'REAL' : 'TEXT';
			$colDefs .= ",\n\t\t\t\t$safeName $sqlType";
			$i++;
		}

		$table = self::TABLE_NAME;
		$geomCol = self::GEOM_COLUMN;

		$db->exec("
			CREATE TABLE IF NOT EXISTS $table (
				fid     INTEGER PRIMARY KEY AUTOINCREMENT,
				$geomCol BLOB NOT NULL
				$colDefs
			)
		");

		$db->exec("
			INSERT OR IGNORE INTO gpkg_contents
				(table_name, data_type, identifier, srs_id)
			VALUES ('$table', 'features', '$table', " . self::SRS_ID . ")
		");

		$db->exec("
			INSERT OR IGNORE INTO gpkg_geometry_columns
				(table_name, column_name, geometry_type_name, srs_id, z, m)
			VALUES ('$table', '$geomCol', '$geomType', " . self::SRS_ID . ", 0, 0)
		");
	}

	// ── Geometría ─────────────────────────────────────────────────────────────

	/**
	 * Convierte WKT a un blob binario compatible con GeoPackage (ISO 13249 / OGC 12-128r18).
	 * Estructura: GeoPackageBinaryHeader (8 bytes, little-endian) + WKB ISO.
	 *
	 * Header:
	 *   [0-1] magic: 0x47 0x50 ('G','P')
	 *   [2]   version: 0x00
	 *   [3]   flags: 0x01 (byte-order LE, sin envelope, geometría no vacía)
	 *   [4-7] srs_id: int32 little-endian
	 */
	private function wktToGpkgBlob(string $wkt): string
	{
		$geom = \geoPHP::load($wkt, 'wkt');
		$wkb = $geom->out('wkb'); // WKB con indicador de byte-order propio
		$header = pack('CCCCV', 0x47, 0x50, 0x00, 0x01, self::SRS_ID);
		return $header . $wkb;
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	private function openDb(): \SQLite3
	{
		$path = $this->state->Get('outFile');
		if ($path === false || $path === null)
			throw new PublicException('Ruta de archivo gpkg no definida en el estado');

		$db = new \SQLite3($path);
		$db->exec('PRAGMA journal_mode=WAL');
		$db->exec('PRAGMA foreign_keys=ON');
		return $db;
	}

	private function buildColNames(array $cols, int $wktIndex): array
	{
		$names = [];
		$i = 0;
		foreach ($cols as $col) {
			if ($i !== $wktIndex)
				$names[] = $col['effectiveVariable'] ?? $this->safeColName($col['variable']);
			$i++;
		}
		return $names;
	}

	/**
	 * Nombre de columna seguro para SQLite (sin necesidad de escapar en DDL).
	 * A diferencia del SHP, no hay límite de longitud, así que sólo se sanitizan
	 * caracteres no permitidos.
	 */
	private function safeColName(string $name): string
	{
		$safe = preg_replace('/[^a-zA-Z0-9_]/', '_', $name);
		// Si empieza con dígito, prefijamos con guión bajo
		if (preg_match('/^[0-9]/', $safe))
			$safe = '_' . $safe;
		return $safe;
	}

	/**
	 * Devuelve $base si no colisiona (case-insensitive) con ningún nombre en $usedNames;
	 * si colisiona, agrega el sufijo _1, _2, etc. hasta encontrar uno libre.
	 */
	private function uniqueColName(string $base, array $usedNames): string
	{
		$key = mb_strtolower($base);
		if (!isset($usedNames[$key]))
			return $base;

		$suffix = 1;
		while (isset($usedNames[mb_strtolower("{$base}_{$suffix}")]))
			$suffix++;

		return "{$base}_{$suffix}";
	}

	private function parseCoord($coord): float
	{
		$coord = '' . $coord;
		$coord = Str::Replace($coord, ',', '.');
		if (!Str::Contains($coord, '°'))
			return floatVal($coord);

		$dms = Str::ToUpper(trim($coord));
		$deg = mb_substr($dms, 0, mb_strpos($dms, '°'));
		$mins = mb_substr($dms, mb_strpos($dms, '°') + 1, mb_strpos($dms, "'") - mb_strpos($dms, '°') - 1);
		$secs = mb_substr($dms, mb_strpos($dms, "'") + 1, mb_strpos($dms, '"') - mb_strpos($dms, "'") - 1);
		$sign = 1 - 2 * (Str::Contains($dms, 'W') || Str::Contains($dms, 'S') || Str::Contains($dms, 'O'));

		return $sign * (floatVal($deg) + floatVal($mins) / 60 + floatVal($secs) / 3600);
	}

	private function getColumnByVariable(string $variable): int
	{
		$i = 0;
		foreach ($this->state->Cols() as $col) {
			if ($col['variable'] === $variable)
				return $i;
			$i++;
		}
		return -1;
	}
}