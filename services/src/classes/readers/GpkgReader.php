<?php

namespace helena\classes\readers;

use minga\framework\PublicException;
use minga\framework\Str;
use minga\framework\Log;
use helena\classes\Projections;
use helena\classes\spss\Variable;

// geoPHP se usa como clase global (phayes/geophp no tiene namespace propio)

/**
 * Convierte un GeoPackage (.gpkg) a archivos JSON manteniendo el formato
 * esperado por el pipeline de importación (header.json + data_NNNNN.json).
 *
 * Un GeoPackage es una base de datos SQLite con:
 *   - gpkg_contents          → catálogo de capas
 *   - gpkg_geometry_columns  → columna y tipo geométrico por capa
 *   - gpkg_spatial_ref_sys   → definición de proyecciones
 *   - <table>                → datos: columnas de atributos + blob de geometría
 *
 * La geometría se almacena como GeoPackage Binary (header 'GP' + WKB).
 * El header GPKG se elimina y el WKB puro se delega a geoPHP.
 *
 * Integración con Projections:
 *   Para capas de puntos se requiere:
 *     $projector->ProjectXY(float $x, float $y): array  // devuelve [$x, $y]
 *   Para polígonos/líneas:
 *     $projector->ProjectWkt(string $wkt): string
 *   Si el archivo ya está en WGS84 (srs_id = 4326, el caso más común),
 *   $needsProjection = false y dichos métodos no se invocan.
 */
class GpkgReader extends BaseReader
{
	const MAX_LENGTH = 32;
	const MIN_LENGTH = 5;
	const MAX_ROWS   = 5000;

	// -------------------------------------------------------------------------
	// Interfaz pública (BaseReader)
	// -------------------------------------------------------------------------

	/**
	 * Devuelve los nombres de las capas del GeoPackage.
	 * Permite que la UI muestre un selector igual que con XLSX/XLS.
	 */
	public function ReadSheetNames()
	{
		return self::GetLayerNames($this->sourceFile);
	}

	/**
	 * Convierte la capa indicada por $selectedSheetIndex a JSON.
	 * Si el archivo tiene una sola capa, $selectedSheetIndex puede ser 0 o null.
	 */
	public function WriteJson($selectedSheetIndex)
	{
		$layers = self::GetLayerNames($this->sourceFile);

		if (empty($layers))
			throw new PublicException("El archivo GeoPackage no contiene capas de entidades (features).");

		$layerIndex = (int)($selectedSheetIndex ?? 0);
		if ($layerIndex < 0 || $layerIndex >= count($layers))
			$layerIndex = 0;

		self::Convert($this->sourceFile, $this->folder, $layers[$layerIndex]);
	}

	public function CanGeoreference()
	{
		return 2;
	}

	// -------------------------------------------------------------------------
	// API estática principal
	// -------------------------------------------------------------------------

	public static function GetLayerNames($filename)
	{
		$db = self::OpenDatabase($filename);
		try {
			$result = $db->query(
				"SELECT table_name FROM gpkg_contents
				  WHERE data_type = 'features'
				  ORDER BY table_name"
			);
			if ($result === false)
				throw new PublicException("No se pudo consultar gpkg_contents. ¿Es un GeoPackage válido?");

			$layers = [];
			while ($row = $result->fetchArray(SQLITE3_ASSOC))
				$layers[] = $row['table_name'];

			return $layers;
		} finally {
			$db->close();
		}
	}

	/**
	 * Convierte una capa de un GeoPackage a los archivos JSON del pipeline.
	 *
	 * @param string      $filename   Ruta al archivo .gpkg
	 * @param string      $outputPath Directorio de salida
	 * @param string|null $layerName  Nombre de capa; si es null usa la primera
	 */
	public static function Convert($filename, $outputPath, $layerName = null)
	{
		if (!Str::EndsWith($outputPath, "\\") && !Str::EndsWith($outputPath, "/"))
			$outputPath .= "/";

		$db = self::OpenDatabase($filename);

		try {
			// --- 1. Resolver nombre de capa ----------------------------------
			if ($layerName === null) {
				$row = $db->querySingle(
					"SELECT table_name FROM gpkg_contents
					  WHERE data_type = 'features' LIMIT 1",
					true
				);
				if (!$row)
					throw new PublicException("El archivo GeoPackage no contiene capas de tipo features.");
				$layerName = $row['table_name'];
			}

			// --- 2. Columna de geometría y tipo declarado --------------------
			$stmt = $db->prepare(
				"SELECT column_name, geometry_type_name
				   FROM gpkg_geometry_columns
				  WHERE table_name = :t"
			);
			$stmt->bindValue(':t', $layerName, SQLITE3_TEXT);
			$geomRow = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

			if (!$geomRow)
				throw new PublicException("No se encontró información de geometría para la capa '$layerName'.");

			$geomColumn   = $geomRow['column_name'];
			$declaredType = strtoupper(trim($geomRow['geometry_type_name']));
			// Normaliza: elimina sufijos Z / M / ZM
			$baseGeomType = preg_replace('/\s*(ZM|Z|M)$/', '', $declaredType);
			$useLatLong   = ($baseGeomType === 'POINT');

			// --- 3. Proyección -----------------------------------------------
			[$srsId, $crsFrom] = self::GetProjectionInfo($db, $layerName);

			if (!$crsFrom)
				throw new PublicException("No pudo identificarse la proyección del archivo GeoPackage.");

			$crsTo           = "epsg:4326";
			$needsProjection = ($srsId !== 4326)
				&& !Str::Contains($crsFrom, "GCS_WGS_1984")
				&& !Str::ContainsI($crsFrom, "epsg:4326");

			try {
				$projector = new Projections($crsFrom, $crsTo);
			} catch (\Exception $e) {
				Log::HandleSilentException(
					new PublicException("La proyección indicada no fue reconocida: " . $crsFrom)
				);
				throw new PublicException(
					"La proyección indicada no fue reconocida. " .
					"Procure convertir la información a GCS_WGS_1984 antes de importarla."
				);
			}

			// --- 4. Columnas de atributos (excluye la columna de geometría) --
			$allColumns = self::GetAttributeColumns($db, $layerName, $geomColumn);
			$colNames   = array_column($allColumns, 'name');

			// --- 5. data_NNNNN.json ------------------------------------------
			// Los datos se escriben primero para poder medir el largo real del
			// WKT antes de construir el header (igual que CsvReader).
			$quotedCols = implode(', ', array_map(fn($c) => '"' . $c . '"', $colNames));
			$safeLayer  = str_replace('"', '""', $layerName);
			$sql        = "SELECT $quotedCols, \"$geomColumn\" FROM \"$safeLayer\"";

			$result     = $db->query($sql);
			$rows            = [];
			$fileNumber      = 1;
			$rowsAdded       = 0;
			$maxWktLength    = 0;   // largo máximo observado del WKT
			$observedLengths = [];  // largo máximo observado por columna de atributo

			while ($row = $result->fetchArray(SQLITE3_NUM)) {
				$geomBlob = array_pop($row);   // último campo = blob de geometría
				$values   = array_values($row);

				// Mide el largo real de cada columna de atributo
				foreach ($colNames as $i => $colName) {
					$val = (string)($values[$i] ?? '');
					$observedLengths[$colName] = max($observedLengths[$colName] ?? 0, strlen($val));
				}

				$geomValues = self::ProcessGeometry(
					$geomBlob, $useLatLong, $needsProjection, $projector
				);

				// Mide el largo real del WKT (para polígonos)
				if (!$useLatLong && $geomValues[0] !== null)
					$maxWktLength = max($maxWktLength, strlen($geomValues[0]));

				foreach ($geomValues as $v)
					$values[] = $v;

				$rows[] = $values;
				$rowsAdded++;

				if ($rowsAdded >= self::MAX_ROWS) {
					self::SaveData($outputPath, $fileNumber, $rows);
					$rows      = [];
					$fileNumber++;
					$rowsAdded  = 0;
				}
			}

			if ($rowsAdded > 0 || $fileNumber == 1)
				self::SaveData($outputPath, $fileNumber, $rows);

			// --- 6. header.json (después de medir los datos) -----------------
			$header = self::BuildHeader($allColumns, $colNames, $useLatLong, $maxWktLength, $observedLengths);
			file_put_contents(
				$outputPath . 'header.json',
				json_encode($header, JSON_PRETTY_PRINT | JSON_PARTIAL_OUTPUT_ON_ERROR)
			);

		} finally {
			$db->close();
		}
	}

	// =========================================================================
	// Helpers de base de datos
	// =========================================================================

	private static function OpenDatabase($filename)
	{
		try {
			return new \SQLite3($filename, SQLITE3_OPEN_READONLY);
		} catch (\Exception $e) {
			throw new PublicException("No pudo abrirse el archivo GeoPackage: " . $e->getMessage());
		}
	}

	/**
	 * Devuelve [srsId, crsString] para la capa indicada.
	 * Prefiere la definición WKT del SRS; si no hay, usa "org:id".
	 */
	private static function GetProjectionInfo(\SQLite3 $db, $layerName)
	{
		$stmt = $db->prepare(
			"SELECT srs_id FROM gpkg_contents WHERE table_name = :t"
		);
		$stmt->bindValue(':t', $layerName, SQLITE3_TEXT);
		$row = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

		if (!$row) return [null, null];

		$srsId = (int)$row['srs_id'];

		$stmt2 = $db->prepare(
			"SELECT definition, organization, organization_coordsys_id
			   FROM gpkg_spatial_ref_sys
			  WHERE srs_id = :s"
		);
		$stmt2->bindValue(':s', $srsId, SQLITE3_INTEGER);
		$srsRow = $stmt2->execute()->fetchArray(SQLITE3_ASSOC);

		if (!$srsRow) return [$srsId, null];

		$crsFrom = null;
		$def = trim($srsRow['definition'] ?? '');
		if ($def !== '' && $def !== 'undefined') {
			$crsFrom = $def;
		} elseif (!empty($srsRow['organization'])) {
			$crsFrom = strtolower($srsRow['organization']) . ':' . $srsRow['organization_coordsys_id'];
		}

		return [$srsId, $crsFrom];
	}

	/**
	 * Devuelve los metadatos de columnas no-geométricas vía PRAGMA table_info.
	 */
	private static function GetAttributeColumns(\SQLite3 $db, $layerName, $geomColumn)
	{
		$safeLayer = str_replace('"', '""', $layerName);
		$result    = $db->query("PRAGMA table_info(\"$safeLayer\")");
		$columns   = [];
		while ($col = $result->fetchArray(SQLITE3_ASSOC)) {
			if ($col['name'] === $geomColumn) continue;
			$columns[] = $col;
		}
		return $columns;
	}

	// =========================================================================
	// Procesamiento de geometría con geoPHP
	// =========================================================================

	/**
	 * Extrae el WKB puro desde el blob binario GeoPackage.
	 *
	 * Formato GeoPackage Binary (OGC 12-128r15 §2.1.3):
	 *   Bytes 0-1 : magic 'G', 'P'
	 *   Byte  2   : version
	 *   Byte  3   : flags
	 *                 bits 1-3 = tipo de envelope (0=ninguno, 1=XY, 2=XYZ,
	 *                                               3=XYM, 4=XYZM)
	 *                 bit  4   = empty geometry flag
	 *   Bytes 4-7 : SRS ID (int32)
	 *   Bytes 8+  : envelope opcional (doublesCount × 8 bytes)
	 *   Luego     : WKB estándar ISO
	 */
	private static function ExtractWkbFromGpkgBlob($blob)
	{
		if (strlen($blob) < 8) return null;
		if ($blob[0] !== 'G')  return null;
		if ($blob[1] !== 'P')  return null;

		$flags        = ord($blob[3]);
		$envelopeType = ($flags >> 1) & 0x07;

		// doubles por tipo de envelope: 0=ninguno, 1=XY(4), 2=XYZ(6), 3=XYM(6), 4=XYZM(8)
		$envDoubles = [0, 4, 6, 6, 8];
		$wkbOffset  = 8 + ($envDoubles[$envelopeType] ?? 0) * 8;

		if ($wkbOffset >= strlen($blob)) return null;

		return substr($blob, $wkbOffset);
	}

	/**
	 * Convierte un blob GPKG a los valores de columna:
	 *   - Puntos    → [latitud, longitud]
	 *   - Polígonos → [wkt]
	 *
	 * Usa geoPHP para parsear el WKB y obtener el WKT.
	 */
	private static function ProcessGeometry($geomBlob, bool $useLatLong, bool $needsProjection, $projector)
	{
		if ($geomBlob === null || $geomBlob === '')
			return $useLatLong ? [null, null] : [null];

		$wkb = self::ExtractWkbFromGpkgBlob($geomBlob);
		if ($wkb === null)
			return $useLatLong ? [null, null] : [null];

		try {
			$geom = \geoPHP::load($wkb, 'wkb');
		} catch (\Exception $e) {
			return $useLatLong ? [null, null] : [null];
		}

		if ($geom === false || $geom === null)
			return $useLatLong ? [null, null] : [null];

		if ($useLatLong) {
			$x = $geom->x();
			$y = $geom->y();
			if ($needsProjection)
				[$x, $y] = $projector->ProjectXY($x, $y);
			return [$y, $x]; // latitud (y), longitud (x)
		} else {
			$wkt = $geom->out('wkt');
			if ($needsProjection)
				$wkt = $projector->ProjectWkt($wkt);
			return [$wkt];
		}
	}

	// =========================================================================
	// Construcción del header JSON
	// =========================================================================

	private static function BuildHeader(array $allColumns, array $colNames, bool $useLatLong, int $maxWktLength = 0, array $observedLengths = [])
	{
		$header = [
			'varNames'     => [],
			'varTypes'     => [],
			'varLabels'    => [],
			'varFormats'   => [],
			'columnWidths' => [],
			'isNumber'     => [],
			'measureLevels'=> [],
			'alignments'   => [],
			'valueLabels'  => [],
		];

		$names = self::GetVarNames($colNames);
		$header['varNames'] = $names;

		for ($i = 0; $i < count($names); $i++) {
			$varName      = $names[$i];
			$origName     = $colNames[$i];
			$declaredType = strtoupper(trim($allColumns[$i]['type'] ?? ''));
			[$isNumber, $size, $decimals] = self::GetTypeAttributes($declaredType);

			// Para columnas de texto, el tamaño real observado en los datos
			// prevalece sobre el tipo declarado (que en SQLite es impreciso)
			if (!$isNumber && isset($observedLengths[$origName]))
				$size = max($observedLengths[$origName], 1);

			$header['isNumber'][$varName]     = $isNumber;
			$header['columnWidths'][$varName] = self::GetColumnWidths($size);
			$header['varFormats'][$varName]   = self::GetVarFormats($isNumber, $size, $decimals);
			self::CompleteColumnAttributes($header, $varName, $origName);
		}

		// Columna(s) de geometría — mismos tamaños que ShapefileReader
		if ($useLatLong) {
			$header['varNames'][] = 'latitud';
			$header['varNames'][] = 'longitud';
			$header['varNames']   = self::NumerateDuplicates($header['varNames']);
			$n      = count($header['varNames']);
			$latCol = $header['varNames'][$n - 2];
			$lonCol = $header['varNames'][$n - 1];
			self::FormatCoordinateColumn($header, $latCol, 'Latitud de la ubicación');
			self::FormatCoordinateColumn($header, $lonCol, 'Longitud de la ubicación');
		} else {
			$header['varNames'][] = 'wkt';
			$header['varNames']   = self::NumerateDuplicates($header['varNames']);
			$geomCol  = $header['varNames'][count($header['varNames']) - 1];
			$wktSize  = max($maxWktLength, 1);  // largo real medido durante la iteración
			self::FormatTextColumn($header, $geomCol, 'WKT con polígonos', $wktSize);
		}

		$header['valueLabels'] = new \stdClass();
		return $header;
	}

	/**
	 * Mapea el tipo SQLite declarado a [isNumber, size, decimals].
	 */
	private static function GetTypeAttributes($sqliteType)
	{
		// Elimina parámetros numéricos: "VARCHAR(255)" → "VARCHAR"
		$base = trim(preg_replace('/\(.*\)/', '', $sqliteType));

		$intTypes   = ['INT', 'INTEGER', 'TINYINT', 'SMALLINT', 'MEDIUMINT',
		               'BIGINT', 'INT2', 'INT4', 'INT8', 'BOOLEAN'];
		$floatTypes = ['REAL', 'DOUBLE', 'FLOAT', 'NUMERIC', 'DECIMAL', 'NUMBER'];

		foreach ($intTypes as $t)
			if ($base === $t || Str::StartsWith($base, $t))
				return [true, 10, 0];

		foreach ($floatTypes as $t)
			if ($base === $t || Str::StartsWith($base, $t))
				return [true, 20, 6];

		if ($base === 'DATE' || $base === 'DATETIME')
			return [false, 20, 0];

		// TEXT, VARCHAR, BLOB, '' y cualquier otro tipo
		return [false, 255, 0];
	}

	// =========================================================================
	// Helpers de header (mirror de ShapefileReader)
	// =========================================================================

	private static function CompleteColumnAttributes(&$header, $varName, $caption)
	{
		$header['varTypes'][$varName]      = self::GetVarTypes($header['varFormats'][$varName]);
		$header['measureLevels'][$varName] = self::GetMeasureLevels($header['varFormats'][$varName]);
		$header['varLabels'][$varName]     = $caption;
		$header['alignments'][$varName]    = self::GetAlignments($header['isNumber'], $varName);
	}

	private static function FormatCoordinateColumn(&$header, $col, $label)
	{
		$header['isNumber'][$col]     = true;
		$header['columnWidths'][$col] = 10;
		$header['varFormats'][$col]   = self::GetVarFormats(true, 10, 6);
		self::CompleteColumnAttributes($header, $col, $label);
	}

	private static function FormatTextColumn(&$header, $col, $label, $size)
	{
		$header['isNumber'][$col]     = false;
		$header['columnWidths'][$col] = $size;
		$header['varFormats'][$col]   = self::GetVarFormats(false, $size, 0);
		self::CompleteColumnAttributes($header, $col, $label);
		if ($size > 100) $header['columnWidths'][$col] = 100;
	}

	private static function GetColumnWidths($length)
	{
		if ($length > self::MAX_LENGTH) return self::MAX_LENGTH;
		if ($length < self::MIN_LENGTH) return self::MIN_LENGTH;
		return $length;
	}

	private static function GetAlignments($isNumberList, $varName)
	{
		return $isNumberList[$varName] ? 'right' : 'left';
	}

	private static function GetMeasureLevels($varFormat)
	{
		if ($varFormat[0] === 'F') return 'ratio';
		if ($varFormat[0] === 'A') return 'nominal';
		throw new PublicException('El nivel de medida indicado no está soportado (' . $varFormat . ')');
	}

	private static function GetVarFormats(bool $isNumber, int $size, int $decimals)
	{
		if (!$isNumber) return 'A' . $size;
		$ret = 'F' . $size;
		if ($decimals > 0) $ret .= '.' . $decimals;
		return $ret;
	}

	private static function GetVarTypes($varFormat)
	{
		if ($varFormat[0] === 'F') return 0;
		if ($varFormat[0] === 'A') return (int)substr($varFormat, 1);
		throw new PublicException('El tipo de variable indicado no está soportado (' . $varFormat . ')');
	}

	private static function GetVarNames(array $names)
	{
		$ret = [];
		for ($i = 0; $i < count($names); $i++) {
			$varname = mb_strtolower(trim($names[$i]));
			if ($varname === '') break;
			$names[$i] = Variable::FixName($varname);
			if ($names[$i] === '')
				$names[$i] = 'x';
			elseif (Str::IsNumber($names[$i]) || $names[$i][0] === '_')
				$names[$i] = 'x' . $names[$i];
			$ret[] = $names[$i];
		}
		return self::NumerateDuplicates($ret);
	}

	private static function NumerateDuplicates(array $names)
	{
		$uniqueNames = array_unique($names);
		if (count($names) === count($uniqueNames)) return $names;

		for ($i = 0; $i < count($names); $i++) {
			$k = array_search($names[$i], $uniqueNames);
			if ($k === false)
				$names[$i] = self::GetNewName($names, $names[$i]);
			else
				unset($uniqueNames[$k]);
		}
		return $names;
	}

	private static function GetNewName(array $names, $name)
	{
		for ($i = 1; $i < 101; $i++) {
			$newName = $name . $i;
			if (!in_array($newName, $names)) return $newName;
		}
		throw new PublicException('No ha sido posible calcular un nuevo nombre');
	}

	private static function SaveData($outputPath, $fileNumber, $rows)
	{
		$file = $outputPath . 'data_' . str_pad($fileNumber, 5, '0', STR_PAD_LEFT) . '.json';
		file_put_contents($file, json_encode($rows));
	}
}
