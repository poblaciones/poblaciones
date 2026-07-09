<?php

namespace helena\classes;

/**
 * SanitizeGeometry
 *
 * Normaliza geometrías (Polygon, MultiPolygon, LineString) para el pipeline
 * de importación: corrige la orientación de los anillos (exterior horario,
 * interiores antihorarios) y aplica la simplificación de SimplifyGeometry
 * cuando se indica una tolerancia.
 *
 * Diseño orientado a rendimiento y estabilidad con geometrías grandes:
 * geoPHP (clases globales, sin namespace: \geoPhp, \Geometry, etc.) se usa
 * una única vez, para parsear WKB o WKT. A partir de ahí todo el trabajo
 * (proyección, simplificación, orientación, generación del WKT de salida)
 * se hace sobre arrays de coordenadas [lon, lat] anidados —el mismo formato
 * que consume SimplifyGeometry—, sin crear objetos por punto ni re-parsear
 * strings intermedios. El WKT de salida se genera por concatenación directa.
 *
 * Las coordenadas se asumen en longitud/latitud (grados, EPSG:4326) al
 * momento de simplificar, dado que SimplifyGeometry mide su tolerancia en
 * metros sobre la esfera. Si la fuente está en otra proyección, debe pasarse
 * un Projections al método SanitizeWkb para reproyectar antes de simplificar.
 *
 * Uso típico (pipeline GeoPackage):
 *   $wkt = SanitizeGeometry::SanitizeWkb($wkb, 0.05, $projectorONull);
 *
 * Uso sobre WKT:
 *   $wkt = SanitizeGeometry::SanitizeString($wkt, 0.05);
 */
class SanitizeGeometry
{
	/** Radio medio de la Tierra, en metros (mismo valor que SimplifyGeometry). */
	private const EARTH_RADIUS_M = 6371008.7714151;

	/**
	 * Distancia mínima deseada entre dos puntos consecutivos de un anillo,
	 * en metros reales. Si tras la simplificación pedida quedan puntos más
	 * próximos que esto, se aplica una única re-simplificación con esta
	 * tolerancia. Nunca se descarta el resultado por este motivo: un WKT
	 * con algún par de puntos próximos es preferible a abortar el proceso.
	 */
	private const MIN_POINT_DISTANCE_M = 0.5;

	// ------------------------------------------------------------------
	// API pública
	// ------------------------------------------------------------------

	/**
	 * Pipeline completo desde WKB: parseo (lector propio, con soporte de
	 * geometrías 2D, Z, M y ZM en formato ISO o EWKB), reproyección opcional
	 * a WGS84, simplificación, corrección de orientación de anillos y
	 * serialización a WKT (siempre 2D).
	 *
	 * @param string           $wkb          WKB binario (sin header GeoPackage)
	 * @param float            $dpThresholdM Tolerancia de simplificación en metros; 0 la desactiva
	 * @param Projections|null $projector    Proyector hacia WGS84, o null si la fuente ya está en lon/lat
	 * @return string|null                   WKT normalizado, o null si el WKB no pudo procesarse
	 */
	public static function SanitizeWkb(string $wkb, float $dpThresholdM = 0.0, ?Projections $projector = null): ?string
	{
		$parsed = self::parseWkb($wkb);
		if ($parsed === null || !self::hasValidStructure($parsed['type'], $parsed['coordinates']))
			return null;

		return self::sanitizeArraysToWkt($parsed['type'], $parsed['coordinates'], $dpThresholdM, $projector);
	}

	/**
	 * Lee un punto desde WKB (2D, Z, M o ZM) y devuelve ['x' => ..., 'y' => ...],
	 * o null si el WKB no contiene un punto válido.
	 */
	public static function ReadWkbPoint(string $wkb): ?array
	{
		$parsed = self::parseWkb($wkb);
		if ($parsed === null || $parsed['type'] !== 'Point')
			return null;

		return ['x' => $parsed['coordinates'][0], 'y' => $parsed['coordinates'][1]];
	}

	/**
	 * Pipeline completo desde una geometría de la biblioteca Shapefile
	 * (gasparesganga/php-shapefile o compatible): convierte el resultado de
	 * getArray() al formato interno, reproyecta a WGS84 si se indica un
	 * proyector, simplifica, corrige orientación y serializa a WKT (2D;
	 * las coordenadas Z/M se descartan).
	 *
	 * @param object           $shapeGeometry Geometría con getArray() y constante GEOJSON_BASETYPE
	 * @param float            $dpThresholdM  Tolerancia de simplificación en metros; 0 la desactiva
	 * @param Projections|null $projector     Proyector hacia WGS84, o null si la fuente ya está en lon/lat
	 * @return string|null                    WKT normalizado, o null si la geometría no pudo procesarse
	 */
	public static function SanitizeShape($shapeGeometry, float $dpThresholdM = 0.0, ?Projections $projector = null): ?string
	{
		$type = $shapeGeometry::GEOJSON_BASETYPE;
		$arr = $shapeGeometry->getArray();
		if ($arr === null)
			return null;

		switch ($type) {
			case 'LineString':
				$coordinates = self::shapePointList($arr);
				break;
			case 'MultiLineString':
				$coordinates = [];
				foreach ($arr['parts'] as $part)
					$coordinates[] = self::shapePointList($part);
				break;
			case 'Polygon':
				$coordinates = self::shapePolygon($arr);
				break;
			case 'MultiPolygon':
				$coordinates = [];
				foreach ($arr['parts'] as $part)
					$coordinates[] = self::shapePolygon($part);
				break;
			default:
				return null; // Point/MultiPoint no corresponden a esta ruta
		}

		if (!self::hasValidStructure($type, $coordinates))
			return null;

		return self::sanitizeArraysToWkt($type, $coordinates, $dpThresholdM, $projector);
	}

	/**
	 * @return array<int, array{0: float, 1: float}>
	 */
	private static function shapePointList(array $linestringArray): array
	{
		$points = [];
		foreach ($linestringArray['points'] as $pt)
			$points[] = [$pt['x'], $pt['y']];
		return $points;
	}

	/**
	 * @return array<int, array<int, array{0: float, 1: float}>>
	 */
	private static function shapePolygon(array $polygonArray): array
	{
		$rings = [];
		foreach ($polygonArray['rings'] as $ring)
			$rings[] = self::shapePointList($ring);
		return $rings;
	}

	/**
	 * Igual que SanitizeWkb, pero recibiendo y devolviendo WKT.
	 */
	public static function SanitizeString(string $wkt, float $dpThresholdM = 0.0, ?Projections $projector = null): ?string
	{
		$parsed = self::parseToArrays($wkt, 'wkt');
		if ($parsed === null)
			return null;

		return self::sanitizeArraysToWkt($parsed['type'], $parsed['coordinates'], $dpThresholdM, $projector);
	}

	/**
	 * Variante sobre objetos geoPHP, por compatibilidad. Devuelve un objeto
	 * geoPHP reconstruido desde el WKT normalizado.
	 *
	 * @return \Geometry|null
	 */
	public static function Sanitize(\Geometry $ele, float $dpThresholdM = 0.0): ?\Geometry
	{
		$type = $ele->geometryType();
		if (!in_array($type, ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString'], true))
			return null;

		$wkt = self::sanitizeArraysToWkt($type, $ele->asArray(), $dpThresholdM, null);
		if ($wkt === null)
			return null;

		try {
			$geom = \geoPhp::load($wkt, 'wkt');
		} catch (\Exception $e) {
			return null;
		}

		return ($geom instanceof \Geometry) ? $geom : null;
	}

	// ------------------------------------------------------------------
	// Núcleo del pipeline (sobre arrays de coordenadas)
	// ------------------------------------------------------------------

	/**
	 * Parsea la entrada con geoPHP y la convierte de inmediato a arrays de
	 * coordenadas, liberando los objetos. Devuelve null ante entradas
	 * inválidas o tipos no soportados.
	 *
	 * @return array{type: string, coordinates: array}|null
	 */
	private static function parseToArrays(string $data, string $format): ?array
	{
		// geoPHP puede emitir warnings ante datos anómalos sin lanzar
		// excepción; se silencian durante el parseo y el fallo se determina
		// por el resultado (tipo y estructura), no por la señal de error.
		set_error_handler(function () { return true; });
		try {
			$geom = \geoPhp::load($data, $format);
		} catch (\Throwable $e) {
			return null;
		} finally {
			restore_error_handler();
		}

		if (!($geom instanceof \Geometry))
			return null;

		$type = $geom->geometryType();
		if (!in_array($type, ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString'], true))
			return null;

		// asArray() de geoPHP produce el formato GeoJSON anidado de [x, y],
		// exactamente el que consume SimplifyGeometry.
		$coordinates = $geom->asArray();
		unset($geom); // liberar los objetos por punto lo antes posible

		if (!self::hasValidStructure($type, $coordinates))
			return null;

		return ['type' => $type, 'coordinates' => $coordinates];
	}

	/**
	 * Validación estructural mínima de las coordenadas parseadas: evita que
	 * geometrías vacías o degeneradas (producto de blobs corruptos) sigan
	 * por el pipeline y terminen serializadas como WKT inválido.
	 */
	private static function hasValidStructure(string $type, array $coordinates): bool
	{
		switch ($type) {
			case 'LineString':
				return count($coordinates) >= 2;

			case 'MultiLineString':
				if (count($coordinates) === 0)
					return false;
				foreach ($coordinates as $line)
					if (!is_array($line) || count($line) < 2)
						return false;
				return true;

			case 'Polygon':
				if (count($coordinates) === 0)
					return false;
				foreach ($coordinates as $ring)
					if (!is_array($ring) || count($ring) < 4)
						return false;
				return true;

			case 'MultiPolygon':
				if (count($coordinates) === 0)
					return false;
				foreach ($coordinates as $polygon)
					if (!is_array($polygon) || !self::hasValidStructure('Polygon', $polygon))
						return false;
				return true;

			default:
				return false;
		}
	}

	/**
	 * Proyección → simplificación → orientación → WKT, todo sobre arrays.
	 * Antes de todo se eliminan los puntos consecutivos duplicados (repetición
	 * exacta de coordenadas, frecuente en datos censales/catastrales): no
	 * aportan información geométrica y degeneran la matemática esférica de
	 * SimplifyGeometry cuando quedan en los extremos de un rango (el círculo
	 * máximo por dos puntos idénticos es indefinido).
	 */
	private static function sanitizeArraysToWkt(string $type, array $coordinates, float $dpThresholdM, ?Projections $projector): ?string
	{
		$coordinates = self::deduplicate($type, $coordinates);
		if ($coordinates === null || !self::hasValidStructure($type, $coordinates))
			return null;

		if ($projector !== null)
			self::projectCoordinates($coordinates, $type, $projector);

		if ($dpThresholdM > 0) {
			$coordinates = self::simplify($type, $coordinates, $dpThresholdM);
			if ($coordinates === null)
				return null;
		}

		if ($type === 'Polygon') {
			self::orientPolygon($coordinates);
		} elseif ($type === 'MultiPolygon') {
			foreach ($coordinates as &$polygon)
				self::orientPolygon($polygon);
			unset($polygon);
		}

		// Si quedaron puntos consecutivos más próximos que el mínimo, una
		// única re-simplificación con esa tolerancia. Sin reintentos
		// adicionales: el resultado se devuelve de cualquier manera.
		if (($type === 'Polygon' || $type === 'MultiPolygon') && self::hasTooClosePoints($type, $coordinates)) {
			$resimplified = self::simplify($type, $coordinates, self::MIN_POINT_DISTANCE_M);
			if ($resimplified !== null) {
				$coordinates = $resimplified;
				if ($type === 'Polygon') {
					self::orientPolygon($coordinates);
				} else {
					foreach ($coordinates as &$polygon)
						self::orientPolygon($polygon);
					unset($polygon);
				}
			}
		}

		return self::toWkt($type, $coordinates);
	}

	/**
	 * Delegación a SimplifyGeometry según el tipo. Devuelve null solo si la
	 * simplificación descartó la geometría entera (anillo exterior degenerado).
	 */
	private static function simplify(string $type, array $coordinates, float $toleranceM): ?array
	{
		$simplifier = new SimplifyGeometry();

		switch ($type) {
			case 'Polygon':
				return $simplifier->PolygonSimplify($coordinates, $toleranceM);
			case 'MultiPolygon':
				return $simplifier->MultiPolygonSimplify($coordinates, $toleranceM);
			case 'LineString':
				$res = $simplifier->LineStringSimplify($coordinates, $toleranceM);
				return ($res !== null && count($res) >= 2) ? $res : $coordinates;
			case 'MultiLineString':
				$res = $simplifier->MultiLineStringSimplify($coordinates, $toleranceM);
				return ($res !== null) ? $res : $coordinates;
			default:
				return $coordinates;
		}
	}

	// ------------------------------------------------------------------
	// Deduplicación de puntos consecutivos exactos
	// ------------------------------------------------------------------

	/**
	 * Elimina puntos consecutivos con coordenadas exactamente iguales.
	 * Anillos que queden degenerados (menos de un triángulo cerrado) se
	 * descartan si son interiores; si el exterior degenera, se descarta el
	 * polígono; si no queda ningún polígono, devuelve null.
	 *
	 * @return array|null
	 */
	private static function deduplicate(string $type, array $coordinates): ?array
	{
		switch ($type) {
			case 'LineString':
				$line = self::deduplicateLine($coordinates);
				return count($line) >= 2 ? $line : null;

			case 'MultiLineString':
				$lines = [];
				foreach ($coordinates as $line) {
					$clean = self::deduplicateLine($line);
					if (count($clean) >= 2)
						$lines[] = $clean;
				}
				return count($lines) > 0 ? $lines : null;

			case 'Polygon':
				return self::deduplicatePolygon($coordinates);

			case 'MultiPolygon':
				$polygons = [];
				foreach ($coordinates as $polygon) {
					$clean = self::deduplicatePolygon($polygon);
					if ($clean !== null)
						$polygons[] = $clean;
				}
				return count($polygons) > 0 ? $polygons : null;

			default:
				return $coordinates;
		}
	}

	private static function deduplicatePolygon(array $rings): ?array
	{
		$result = [];
		foreach ($rings as $i => $ring) {
			$clean = self::deduplicateRing($ring);
			if ($clean === null) {
				if ($i === 0)
					return null; // anillo exterior degenerado: se descarta el polígono
				continue;        // anillo interior degenerado: se omite
			}
			$result[] = $clean;
		}
		return $result;
	}

	/**
	 * Deduplica un anillo cerrado garantizando el cierre. Devuelve null si
	 * queda por debajo de un triángulo cerrado (4 puntos).
	 */
	private static function deduplicateRing(array $ring): ?array
	{
		$clean = self::deduplicateLine($ring);

		// Garantizar el cierre (la deduplicación puede haber tocado el final)
		$c = count($clean);
		if ($c > 0 && ($clean[0][0] !== $clean[$c - 1][0] || $clean[0][1] !== $clean[$c - 1][1])) {
			$clean[] = $clean[0];
			$c++;
		}

		return $c >= 4 ? $clean : null;
	}

	private static function deduplicateLine(array $points): array
	{
		$clean = [];
		$prev = null;
		foreach ($points as $pt) {
			if ($prev !== null && $pt[0] === $prev[0] && $pt[1] === $prev[1])
				continue;
			$clean[] = $pt;
			$prev = $pt;
		}
		return $clean;
	}

	// ------------------------------------------------------------------
	// Proyección (usa Projections::ProjectXYPoint, punto por punto)
	// ------------------------------------------------------------------

	private static function projectCoordinates(array &$coordinates, string $type, Projections $projector): void
	{
		switch ($type) {
			case 'LineString':
				self::projectRing($coordinates, $projector);
				break;
			case 'Polygon':
			case 'MultiLineString':
				foreach ($coordinates as &$ring)
					self::projectRing($ring, $projector);
				unset($ring);
				break;
			case 'MultiPolygon':
				foreach ($coordinates as &$polygon) {
					foreach ($polygon as &$ring)
						self::projectRing($ring, $projector);
					unset($ring);
				}
				unset($polygon);
				break;
		}
	}

	private static function projectRing(array &$ring, Projections $projector): void
	{
		foreach ($ring as &$pt) {
			$projected = $projector->ProjectXYPoint(['x' => $pt[0], 'y' => $pt[1]]);
			$pt[0] = $projected['x'];
			$pt[1] = $projected['y'];
		}
		unset($pt);
	}

	// ------------------------------------------------------------------
	// Orientación de anillos (sobre arrays, sin crear objetos)
	// ------------------------------------------------------------------

	/**
	 * Corrige in-place la orientación de los anillos de un polígono:
	 * exterior en sentido horario (signedArea < 0), interiores en sentido
	 * antihorario (signedArea > 0). Solo invierte los que están al revés.
	 *
	 * @param array<int, array<int, array{0: float, 1: float}>> $rings
	 */
	private static function orientPolygon(array &$rings): void
	{
		foreach ($rings as $i => &$ring) {
			$sa = self::signedArea($ring);
			$isExterior = ($i === 0);
			$mustReverse = $isExterior ? ($sa > 0) : ($sa < 0);
			if ($mustReverse)
				$ring = array_reverse($ring);
		}
		unset($ring);
	}

	/**
	 * Área con signo (fórmula del shoelace) sobre un anillo como array de
	 * pares [x, y]. Positiva si es antihorario, negativa si es horario.
	 *
	 * @param array<int, array{0: float, 1: float}> $ring
	 */
	public static function signedArea(array $ring): float
	{
		$c = count($ring);
		if ($c < 3)
			return 0.0;

		$sum = 0.0;
		for ($i = 0; $i < $c; $i++) {
			$j = ($i + 1) % $c;
			$sum += ($ring[$i][0] * $ring[$j][1]) - ($ring[$j][0] * $ring[$i][1]);
		}

		return $sum / 2.0;
	}

	// ------------------------------------------------------------------
	// Distancia mínima entre puntos consecutivos
	// ------------------------------------------------------------------

	private static function hasTooClosePoints(string $type, array $coordinates): bool
	{
		if ($type === 'Polygon')
			return self::polygonHasTooClosePoints($coordinates);

		// MultiPolygon
		foreach ($coordinates as $polygon)
			if (self::polygonHasTooClosePoints($polygon))
				return true;

		return false;
	}

	private static function polygonHasTooClosePoints(array $rings): bool
	{
		foreach ($rings as $ring)
			if (self::ringHasTooClosePoints($ring))
				return true;

		return false;
	}

	/**
	 * Detecta pares de puntos consecutivos a menos de MIN_POINT_DISTANCE_M.
	 * Usa la aproximación equirectangular (exacta a estas escalas y mucho
	 * más barata que el haversine), con el coseno de latitud precomputado
	 * por anillo, y corta en el primer par encontrado.
	 */
	private static function ringHasTooClosePoints(array $ring): bool
	{
		$c = count($ring);
		if ($c < 2)
			return false;

		// Umbral al cuadrado, en radianes de arco al cuadrado
		$thresholdRad = self::MIN_POINT_DISTANCE_M / self::EARTH_RADIUS_M;
		$threshold2 = $thresholdRad * $thresholdRad;

		$cosLat = cos(deg2rad($ring[0][1]));
		$degToRad = M_PI / 180.0;

		for ($i = 0; $i < $c - 1; $i++) {
			$dLon = ($ring[$i + 1][0] - $ring[$i][0]) * $degToRad * $cosLat;
			$dLat = ($ring[$i + 1][1] - $ring[$i][1]) * $degToRad;
			if (($dLon * $dLon + $dLat * $dLat) < $threshold2)
				return true;
		}

		return false;
	}

	// ------------------------------------------------------------------
	// Lector WKB propio
	// ------------------------------------------------------------------
	//
	// El adapter WKB de geoPHP interpreta el tipo como un único byte, por lo
	// que solo entiende WKB 2D: los tipos ISO con Z/M (1003, 2006, 3003...)
	// y los flags EWKB (0x80000000, 0x40000000) no son reconocidos y el
	// parseo devuelve null. Los GeoPackage exportados con dimensión Z son
	// habituales, así que el WKB se lee acá directamente, produciendo
	// arrays de coordenadas 2D (las coordenadas Z/M se descartan).

	private const WKB_POINT = 1;
	private const WKB_LINESTRING = 2;
	private const WKB_POLYGON = 3;
	private const WKB_MULTIPOINT = 4;
	private const WKB_MULTILINESTRING = 5;
	private const WKB_MULTIPOLYGON = 6;

	/**
	 * Parsea WKB (ISO o EWKB, NDR o XDR, con o sin Z/M) a arrays de
	 * coordenadas 2D. Devuelve null ante datos corruptos o tipos no
	 * soportados.
	 *
	 * @return array{type: string, coordinates: array}|null
	 */
	private static function parseWkb(string $wkb): ?array
	{
		try {
			$offset = 0;
			$parsed = self::readWkbGeometry($wkb, $offset);
		} catch (\Throwable $e) {
			return null;
		}

		return $parsed;
	}

	/**
	 * @param int $offset Avanza a medida que se consume el buffer
	 * @return array{type: string, coordinates: array}|null
	 */
	private static function readWkbGeometry(string $wkb, int &$offset): ?array
	{
		$len = strlen($wkb);
		if ($offset + 5 > $len)
			return null;

		$byteOrder = ord($wkb[$offset]);
		$offset += 1;
		if ($byteOrder !== 0 && $byteOrder !== 1)
			return null;
		$littleEndian = ($byteOrder === 1);

		$rawType = self::readUint32($wkb, $offset, $littleEndian);
		if ($rawType === null)
			return null;

		// Flags EWKB (PostGIS): Z, M y SRID embebido
		$hasZ = (bool)($rawType & 0x80000000);
		$hasM = (bool)($rawType & 0x40000000);
		$hasSrid = (bool)($rawType & 0x20000000);
		$type = $rawType & 0x0FFFFFFF;

		// Convención ISO: 1000 = Z, 2000 = M, 3000 = ZM
		if ($type >= 1000) {
			$isoDim = intdiv($type, 1000);
			$type = $type % 1000;
			if ($isoDim === 1 || $isoDim === 3) $hasZ = true;
			if ($isoDim === 2 || $isoDim === 3) $hasM = true;
		}

		if ($hasSrid) {
			if (self::readUint32($wkb, $offset, $littleEndian) === null)
				return null;
		}

		$dim = 2 + ($hasZ ? 1 : 0) + ($hasM ? 1 : 0);

		switch ($type) {
			case self::WKB_POINT:
				$pts = self::readWkbCoords($wkb, $offset, $littleEndian, 1, $dim);
				return $pts === null ? null : ['type' => 'Point', 'coordinates' => $pts[0]];

			case self::WKB_LINESTRING:
				$coords = self::readWkbPointList($wkb, $offset, $littleEndian, $dim);
				return $coords === null ? null : ['type' => 'LineString', 'coordinates' => $coords];

			case self::WKB_POLYGON:
				$rings = self::readWkbRings($wkb, $offset, $littleEndian, $dim);
				return $rings === null ? null : ['type' => 'Polygon', 'coordinates' => $rings];

			case self::WKB_MULTIPOLYGON:
				$count = self::readUint32($wkb, $offset, $littleEndian);
				if ($count === null)
					return null;
				$polygons = [];
				for ($i = 0; $i < $count; $i++) {
					// Cada componente trae su propio header (orden + tipo)
					$sub = self::readWkbGeometry($wkb, $offset);
					if ($sub === null || $sub['type'] !== 'Polygon')
						return null;
					$polygons[] = $sub['coordinates'];
				}
				return ['type' => 'MultiPolygon', 'coordinates' => $polygons];

			case self::WKB_MULTILINESTRING:
				$count = self::readUint32($wkb, $offset, $littleEndian);
				if ($count === null)
					return null;
				$lines = [];
				for ($i = 0; $i < $count; $i++) {
					$sub = self::readWkbGeometry($wkb, $offset);
					if ($sub === null || $sub['type'] !== 'LineString')
						return null;
					$lines[] = $sub['coordinates'];
				}
				return ['type' => 'MultiLineString', 'coordinates' => $lines];

			case self::WKB_MULTIPOINT:
			default:
				return null; // tipos no requeridos por el pipeline
		}
	}

	private static function readUint32(string $wkb, int &$offset, bool $littleEndian): ?int
	{
		if ($offset + 4 > strlen($wkb))
			return null;
		$v = unpack($littleEndian ? 'V' : 'N', $wkb, $offset);
		$offset += 4;
		return $v === false ? null : $v[1];
	}

	/**
	 * Lista de puntos precedida por su contador uint32.
	 */
	private static function readWkbPointList(string $wkb, int &$offset, bool $littleEndian, int $dim): ?array
	{
		$count = self::readUint32($wkb, $offset, $littleEndian);
		if ($count === null)
			return null;
		return self::readWkbCoords($wkb, $offset, $littleEndian, $count, $dim);
	}

	/**
	 * Anillos de un polígono: contador de anillos + lista de puntos por anillo.
	 */
	private static function readWkbRings(string $wkb, int &$offset, bool $littleEndian, int $dim): ?array
	{
		$ringCount = self::readUint32($wkb, $offset, $littleEndian);
		if ($ringCount === null)
			return null;

		$rings = [];
		for ($i = 0; $i < $ringCount; $i++) {
			$ring = self::readWkbPointList($wkb, $offset, $littleEndian, $dim);
			if ($ring === null)
				return null;
			$rings[] = $ring;
		}
		return $rings;
	}

	/**
	 * Lee $count puntos de $dim doubles cada uno, descartando Z/M.
	 * unpack con 'e'/'E' (doubles little/big endian, independientes de la
	 * arquitectura) sobre el bloque completo, en una sola llamada.
	 *
	 * @return array<int, array{0: float, 1: float}>|null
	 */
	private static function readWkbCoords(string $wkb, int &$offset, bool $littleEndian, int $count, int $dim): ?array
	{
		$doubles = $count * $dim;
		$bytes = $doubles * 8;
		if ($count < 0 || $offset + $bytes > strlen($wkb))
			return null;

		$values = unpack(($littleEndian ? 'e' : 'E') . $doubles, $wkb, $offset);
		if ($values === false)
			return null;
		$offset += $bytes;

		$points = [];
		for ($i = 1; $i <= $doubles; $i += $dim) {
			$x = $values[$i];
			$y = $values[$i + 1];
			if (!is_finite($x) || !is_finite($y))
				return null;
			$points[] = [$x, $y];
		}
		return $points;
	}

	// ------------------------------------------------------------------
	// Serialización a WKT (por concatenación directa, sin geoPHP)
	// ------------------------------------------------------------------

	private static function toWkt(string $type, array $coordinates): string
	{
		switch ($type) {
			case 'LineString':
				return 'LINESTRING' . self::ringToWkt($coordinates);
			case 'MultiLineString':
				return 'MULTILINESTRING' . self::polygonToWkt($coordinates);
			case 'Polygon':
				return 'POLYGON' . self::polygonToWkt($coordinates);
			case 'MultiPolygon':
				$parts = [];
				foreach ($coordinates as $polygon)
					$parts[] = self::polygonToWkt($polygon);
				return 'MULTIPOLYGON(' . implode(',', $parts) . ')';
			default:
				return '';
		}
	}

	private static function polygonToWkt(array $rings): string
	{
		$parts = [];
		foreach ($rings as $ring)
			$parts[] = self::ringToWkt($ring);
		return '(' . implode(',', $parts) . ')';
	}

	private static function ringToWkt(array $ring): string
	{
		$parts = [];
		foreach ($ring as $pt)
			$parts[] = $pt[0] . ' ' . $pt[1];
		return '(' . implode(',', $parts) . ')';
	}
}
