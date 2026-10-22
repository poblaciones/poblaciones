<?php

declare(strict_types=1);

namespace helena\classes;

/**
 * Geometría en memoria (tipo + coordenadas anidadas). Reemplaza a phayes/geoPHP,
 * que no es compatible con PHP 8.3 y estaba limitada a WKB 2D little-endian.
 *
 * Alcance: lo que la plataforma efectivamente usaba de geoPHP.
 *   - Lectura:   WKB (ISO/EWKB, NDR/XDR, con o sin Z/M) y WKT.
 *   - Escritura: WKT, WKB (NDR, 2D, sin SRID) y GeoJSON.
 *   - Consulta:  AsArray(), GetType(), GetBBox(), IsEmpty().
 *
 * Las coordenadas Z/M se descartan: toda geometría resultante es 2D, con el
 * orden de ejes tal como fue leído (la plataforma almacena [lat, lon]; esta
 * clase no lo reordena).
 *
 * Formato interno de $coordinates, igual al de GeoJSON:
 *   Point            [x, y]                          (vacío: [])
 *   LineString       [[x, y], ...]
 *   Polygon          [[[x, y], ...], ...]            (anillos)
 *   MultiPoint       [[x, y], ...]
 *   MultiLineString  [[[x, y], ...], ...]
 *   MultiPolygon     [[[[x, y], ...], ...], ...]
 *   GeometryCollection: usa $geometries (lista de GeoGeometry) en lugar de $coordinates.
 */
class GeoGeometry
{
	public const POINT = 'Point';
	public const LINESTRING = 'LineString';
	public const POLYGON = 'Polygon';
	public const MULTIPOINT = 'MultiPoint';
	public const MULTILINESTRING = 'MultiLineString';
	public const MULTIPOLYGON = 'MultiPolygon';
	public const COLLECTION = 'GeometryCollection';

	// Códigos de tipo WKB
	private const WKB_TYPES = [
		1 => self::POINT,
		2 => self::LINESTRING,
		3 => self::POLYGON,
		4 => self::MULTIPOINT,
		5 => self::MULTILINESTRING,
		6 => self::MULTIPOLYGON,
		7 => self::COLLECTION,
	];

	// Tipo de componente que debe tener cada geometría múltiple
	private const MULTI_COMPONENT = [
		self::MULTIPOINT => self::POINT,
		self::MULTILINESTRING => self::LINESTRING,
		self::MULTIPOLYGON => self::POLYGON,
	];

	/** @var string */
	private $type;
	/** @var array */
	private $coordinates;
	/** @var GeoGeometry[] */
	private $geometries;

	private function __construct(string $type, array $coordinates = [], array $geometries = [])
	{
		$this->type = $type;
		$this->coordinates = $coordinates;
		$this->geometries = $geometries;
	}

	// ------------------------------------------------------------------
	// Construcción
	// ------------------------------------------------------------------

	/**
	 * Crea una geometría a partir de un tipo y sus coordenadas (formato GeoJSON).
	 */
	public static function Create(string $type, array $coordinates): GeoGeometry
	{
		if ($type === self::COLLECTION)
			throw new \InvalidArgumentException('Use CreateCollection() para GeometryCollection.');
		if (!in_array($type, self::WKB_TYPES, true))
			throw new \InvalidArgumentException('Tipo de geometría no soportado: ' . $type);
		return new GeoGeometry($type, $coordinates);
	}

	/**
	 * @param GeoGeometry[] $geometries
	 */
	public static function CreateCollection(array $geometries): GeoGeometry
	{
		return new GeoGeometry(self::COLLECTION, [], array_values($geometries));
	}

	/**
	 * Lee la columna binaria de geometría de MySQL: 4 bytes de SRID seguidos
	 * del WKB. Aplica la misma reducción que hacía geoPHP al cargar el valor:
	 * una geometría múltiple con un único componente se devuelve como el
	 * componente (MULTIPOLYGON de un polígono => Polygon), una colección
	 * homogénea se devuelve como la geometría múltiple correspondiente.
	 *
	 * @return GeoGeometry|null null si la geometría resulta vacía (colección sin componentes).
	 * @throws \InvalidArgumentException si el binario está corrupto.
	 */
	public static function FromDbBinary(string $data): ?GeoGeometry
	{
		if (strlen($data) <= 4)
			throw new \InvalidArgumentException('Geometría binaria vacía o truncada.');
		return self::FromWkb(substr($data, 4))->Reduce();
	}

	/**
	 * Lee WKB (ISO o EWKB, little o big endian, con o sin Z/M). Descarta Z/M y SRID.
	 *
	 * @throws \InvalidArgumentException si el WKB es inválido o está truncado.
	 */
	public static function FromWkb(string $wkb): GeoGeometry
	{
		$offset = 0;
		$geometry = self::readWkb($wkb, $offset, 0);
		return $geometry;
	}

	/**
	 * Lee WKT (con o sin prefijo SRID=n; y con o sin sufijos Z/M). Descarta Z/M y SRID.
	 *
	 * @throws \InvalidArgumentException si el WKT es inválido.
	 */
	public static function FromWkt(string $wkt): GeoGeometry
	{
		$text = trim($wkt);
		$pos = 0;
		if (preg_match('/^SRID\s*=\s*-?\d+\s*;/i', $text, $m))
			$pos = strlen($m[0]);

		$geometry = self::readWkt($text, $pos, 0);
		$rest = trim(substr($text, $pos), " \t\r\n;");
		if ($rest !== '')
			throw new \InvalidArgumentException('WKT inválido: contenido inesperado luego de la geometría.');
		return $geometry;
	}

	// ------------------------------------------------------------------
	// Consulta
	// ------------------------------------------------------------------

	public function GetType(): string
	{
		return $this->type;
	}

	/**
	 * Coordenadas en formato GeoJSON anidado. Para GeometryCollection devuelve
	 * una lista de ['type' => ..., 'components' => ...] (mismo formato que geoPHP).
	 * Un punto vacío devuelve [null, null].
	 */
	public function AsArray(): array
	{
		if ($this->type === self::COLLECTION)
		{
			$ret = [];
			foreach ($this->geometries as $geometry)
				$ret[] = ['type' => $geometry->type, 'components' => $geometry->AsArray()];
			return $ret;
		}
		if ($this->type === self::POINT && $this->coordinates === [])
			return [null, null];
		return $this->coordinates;
	}

	public function IsEmpty(): bool
	{
		if ($this->type === self::COLLECTION)
		{
			foreach ($this->geometries as $geometry)
				if (!$geometry->IsEmpty())
					return false;
			return true;
		}
		return !self::hasPoints($this->type, $this->coordinates);
	}

	/**
	 * @return array{maxy: float, miny: float, maxx: float, minx: float}|null null si está vacía.
	 */
	public function GetBBox(): ?array
	{
		$box = null;
		$this->accumulateBBox($box);
		if ($box === null)
			return null;
		return ['maxy' => $box[3], 'miny' => $box[1], 'maxx' => $box[2], 'minx' => $box[0]];
	}

	/**
	 * Reducción equivalente a geoPHP::geometryReduce(): ver FromDbBinary().
	 *
	 * @return GeoGeometry|null null si no queda ningún componente.
	 */
	public function Reduce(): ?GeoGeometry
	{
		if (in_array($this->type, [self::POINT, self::LINESTRING, self::POLYGON], true))
			return $this;

		// Componentes de la geometría múltiple / colección
		$components = $this->Components();
		if (count($components) === 0)
			return null;

		$types = [];
		foreach ($components as $component)
			$types[$component->type] = true;

		if (count($types) === 1)
		{
			if (count($components) === 1)
				return $components[0];
			$type = (string) key($types);
			// Solo hay "Multi" para los tipos simples; una colección de multis queda como colección.
			$multiType = 'Multi' . $type;
			if (isset(self::MULTI_COMPONENT[$multiType]))
			{
				$coordinates = [];
				foreach ($components as $component)
					$coordinates[] = $component->coordinates;
				return new GeoGeometry($multiType, $coordinates);
			}
		}
		return new GeoGeometry(self::COLLECTION, [], $components);
	}

	/**
	 * Componentes como geometrías individuales (solo para tipos múltiples y colecciones).
	 *
	 * @return GeoGeometry[]
	 */
	public function Components(): array
	{
		if ($this->type === self::COLLECTION)
			return $this->geometries;

		if (!isset(self::MULTI_COMPONENT[$this->type]))
			return [$this];

		$componentType = self::MULTI_COMPONENT[$this->type];
		$ret = [];
		foreach ($this->coordinates as $coordinates)
			$ret[] = new GeoGeometry($componentType, $coordinates);
		return $ret;
	}

	// ------------------------------------------------------------------
	// Escritura
	// ------------------------------------------------------------------

	/**
	 * WKT con el formato de geoPHP: 'POLYGON ((x y, x y), (x y, x y))'.
	 * Los números se convierten con la conversión estándar de PHP (ini 'precision').
	 */
	public function ToWkt(): string
	{
		$name = strtoupper($this->type);
		if ($this->IsEmpty())
			return $name . ' EMPTY';
		return $name . ' (' . $this->wktBody() . ')';
	}

	/**
	 * GeoJSON como string. Un punto vacío produce coordinates [null, null].
	 */
	public function ToGeoJson(): string
	{
		return json_encode($this->ToGeoJsonArray());
	}

	public function ToGeoJsonArray(): array
	{
		if ($this->type === self::COLLECTION)
		{
			$geometries = [];
			foreach ($this->geometries as $geometry)
				$geometries[] = ['type' => $geometry->type, 'coordinates' => $geometry->AsArray()];
			return ['type' => self::COLLECTION, 'geometries' => $geometries];
		}
		return ['type' => $this->type, 'coordinates' => $this->AsArray()];
	}

	/**
	 * WKB ISO, 2D, little-endian, sin SRID. Un punto vacío se escribe como NaN NaN.
	 */
	public function ToWkb(): string
	{
		$wkb = "\x01" . pack('V', array_search($this->type, self::WKB_TYPES, true));

		switch ($this->type)
		{
			case self::POINT:
				if ($this->coordinates === [])
					return $wkb . pack('e2', NAN, NAN);
				return $wkb . pack('e2', $this->coordinates[0], $this->coordinates[1]);

			case self::LINESTRING:
				return $wkb . self::wkbPoints($this->coordinates);

			case self::POLYGON:
				return $wkb . self::wkbRings($this->coordinates);

			case self::MULTIPOINT:
			case self::MULTILINESTRING:
			case self::MULTIPOLYGON:
			case self::COLLECTION:
				$components = $this->Components();
				$wkb .= pack('V', count($components));
				foreach ($components as $component)
					$wkb .= $component->ToWkb();
				return $wkb;
		}
		throw new \LogicException('Tipo de geometría no soportado: ' . $this->type);
	}

	/**
	 * Convierte WKT a WKB (NDR, 2D, sin SRID).
	 *
	 * @throws \InvalidArgumentException si el WKT es inválido.
	 */
	public static function WktToWkb(string $wkt): string
	{
		return self::FromWkt($wkt)->ToWkb();
	}

	// ------------------------------------------------------------------
	// Escritura: helpers
	// ------------------------------------------------------------------

	private function wktBody(): string
	{
		switch ($this->type)
		{
			case self::POINT:
				return self::wktPoint($this->coordinates);
			case self::LINESTRING:
				return self::wktPoints($this->coordinates);
			case self::POLYGON:
				return self::wktRings($this->coordinates);
			case self::MULTIPOINT:
				$parts = [];
				foreach ($this->coordinates as $point)
					$parts[] = '(' . self::wktPoint($point) . ')';
				return implode(', ', $parts);
			case self::MULTILINESTRING:
				return self::wktRings($this->coordinates);
			case self::MULTIPOLYGON:
				$parts = [];
				foreach ($this->coordinates as $polygon)
					$parts[] = '(' . self::wktRings($polygon) . ')';
				return implode(', ', $parts);
			case self::COLLECTION:
				$parts = [];
				foreach ($this->geometries as $geometry)
					$parts[] = strtoupper($geometry->type) . ' (' . $geometry->wktBody() . ')';
				return implode(', ', $parts);
		}
		return '';
	}

	private static function wktPoint(array $point): string
	{
		return $point[0] . ' ' . $point[1];
	}

	private static function wktPoints(array $points): string
	{
		$parts = [];
		foreach ($points as $point)
			$parts[] = $point[0] . ' ' . $point[1];
		return implode(', ', $parts);
	}

	private static function wktRings(array $rings): string
	{
		$parts = [];
		foreach ($rings as $ring)
			$parts[] = '(' . self::wktPoints($ring) . ')';
		return implode(', ', $parts);
	}

	private static function wkbPoints(array $points): string
	{
		$flat = [];
		foreach ($points as $point)
		{
			$flat[] = $point[0];
			$flat[] = $point[1];
		}
		return pack('V', count($points)) . ($flat ? pack('e*', ...$flat) : '');
	}

	private static function wkbRings(array $rings): string
	{
		$wkb = pack('V', count($rings));
		foreach ($rings as $ring)
			$wkb .= self::wkbPoints($ring);
		return $wkb;
	}

	// ------------------------------------------------------------------
	// Consulta: helpers
	// ------------------------------------------------------------------

	private static function hasPoints(string $type, array $coordinates): bool
	{
		switch ($type)
		{
			case self::POINT:
				return $coordinates !== [];
			case self::LINESTRING:
			case self::MULTIPOINT:
				return count($coordinates) > 0;
			case self::POLYGON:
			case self::MULTILINESTRING:
				foreach ($coordinates as $ring)
					if (count($ring) > 0)
						return true;
				return false;
			case self::MULTIPOLYGON:
				foreach ($coordinates as $polygon)
					if (self::hasPoints(self::POLYGON, $polygon))
						return true;
				return false;
		}
		return false;
	}

	/**
	 * @param array|null $box [minx, miny, maxx, maxy]
	 */
	private function accumulateBBox(?array &$box): void
	{
		if ($this->type === self::COLLECTION)
		{
			foreach ($this->geometries as $geometry)
				$geometry->accumulateBBox($box);
			return;
		}
		if ($this->type === self::POINT)
		{
			if ($this->coordinates !== [])
				self::growBBox($box, $this->coordinates);
			return;
		}
		self::walkPoints($this->coordinates, $this->depthOf($this->type), $box);
	}

	private function depthOf(string $type): int
	{
		// Niveles de anidamiento por encima de los puntos
		switch ($type)
		{
			case self::LINESTRING:
			case self::MULTIPOINT:
				return 1;
			case self::POLYGON:
			case self::MULTILINESTRING:
				return 2;
			case self::MULTIPOLYGON:
				return 3;
		}
		return 0;
	}

	private static function walkPoints(array $items, int $depth, ?array &$box): void
	{
		if ($depth === 1)
		{
			foreach ($items as $point)
				self::growBBox($box, $point);
			return;
		}
		foreach ($items as $item)
			self::walkPoints($item, $depth - 1, $box);
	}

	/**
	* @param array|null $box [minx, miny, maxx, maxy]
	* @param-out array $box [minx, miny, maxx, maxy]
	*/
	private static function growBBox(?array &$box, array $point): void
	{
		$x = $point[0];
		$y = $point[1];
		if ($box === null)
		{
			$box = [$x, $y, $x, $y];
			return;
		}
		if ($x < $box[0]) $box[0] = $x;
		if ($y < $box[1]) $box[1] = $y;
		if ($x > $box[2]) $box[2] = $x;
		if ($y > $box[3]) $box[3] = $y;
	}

	// ------------------------------------------------------------------
	// Lector WKB
	// ------------------------------------------------------------------

	private const MAX_NESTING = 32;

	private static function readWkb(string $wkb, int &$offset, int $depth): GeoGeometry
	{
		if ($depth > self::MAX_NESTING)
			throw new \InvalidArgumentException('WKB inválido: anidamiento excesivo.');
		if ($offset + 5 > strlen($wkb))
			throw new \InvalidArgumentException('WKB inválido: datos insuficientes.');

		$byteOrder = ord($wkb[$offset]);
		$offset++;
		if ($byteOrder !== 0 && $byteOrder !== 1)
			throw new \InvalidArgumentException('WKB inválido: indicador de orden de bytes desconocido.');
		$little = ($byteOrder === 1);

		$rawType = self::wkbUint32($wkb, $offset, $little);

		// Flags EWKB (PostGIS): Z, M y SRID embebido
		$hasZ = ($rawType & 0x80000000) !== 0;
		$hasM = ($rawType & 0x40000000) !== 0;
		$hasSrid = ($rawType & 0x20000000) !== 0;
		$code = $rawType & 0x0FFFFFFF;

		// Convención ISO: 1000 = Z, 2000 = M, 3000 = ZM
		if ($code >= 1000)
		{
			$isoDim = intdiv($code, 1000);
			$code %= 1000;
			if ($isoDim === 1 || $isoDim === 3) $hasZ = true;
			if ($isoDim === 2 || $isoDim === 3) $hasM = true;
		}
		if ($hasSrid)
			self::wkbUint32($wkb, $offset, $little);

		if (!isset(self::WKB_TYPES[$code]))
			throw new \InvalidArgumentException('WKB inválido: tipo de geometría ' . $code . ' no soportado.');
		$type = self::WKB_TYPES[$code];
		$dim = 2 + ($hasZ ? 1 : 0) + ($hasM ? 1 : 0);

		switch ($type)
		{
			case self::POINT:
				$point = self::wkbCoords($wkb, $offset, $little, 1, $dim)[0];
				// En WKB ISO, POINT EMPTY se codifica como NaN NaN.
				if (is_nan($point[0]) && is_nan($point[1]))
					$point = [];
				return new GeoGeometry(self::POINT, $point);

			case self::LINESTRING:
				return new GeoGeometry(self::LINESTRING, self::wkbPointList($wkb, $offset, $little, $dim));

			case self::POLYGON:
				$rings = [];
				$ringCount = self::wkbCount($wkb, $offset, $little, 4);
				for ($i = 0; $i < $ringCount; $i++)
					$rings[] = self::wkbPointList($wkb, $offset, $little, $dim);
				return new GeoGeometry(self::POLYGON, $rings);
		}

		// Multi* y GeometryCollection: cada componente trae su propio header
		$count = self::wkbCount($wkb, $offset, $little, 9);
		$components = [];
		for ($i = 0; $i < $count; $i++)
			$components[] = self::readWkb($wkb, $offset, $depth + 1);

		if ($type === self::COLLECTION)
			return new GeoGeometry(self::COLLECTION, [], $components);

		$coordinates = [];
		foreach ($components as $component)
		{
			if ($component->type !== self::MULTI_COMPONENT[$type])
				throw new \InvalidArgumentException('WKB inválido: ' . $type . ' con un componente ' . $component->type . '.');
			$coordinates[] = $component->coordinates;
		}
		return new GeoGeometry($type, $coordinates);
	}

	private static function wkbUint32(string $wkb, int &$offset, bool $little): int
	{
		if ($offset + 4 > strlen($wkb))
			throw new \InvalidArgumentException('WKB inválido: datos insuficientes.');
		$v = unpack($little ? 'V' : 'N', $wkb, $offset);
		$offset += 4;
		return $v[1];
	}

	/**
	 * Lee un contador y verifica que los datos restantes puedan contenerlo
	 * (evita reservar memoria por contadores corruptos).
	 *
	 * @param int $minBytesPerItem Mínimo de bytes que ocupa cada elemento contado
	 */
	private static function wkbCount(string $wkb, int &$offset, bool $little, int $minBytesPerItem): int
	{
		$count = self::wkbUint32($wkb, $offset, $little);
		if ($count * $minBytesPerItem > strlen($wkb) - $offset)
			throw new \InvalidArgumentException('WKB inválido: contador mayor que los datos disponibles.');
		return $count;
	}

	private static function wkbPointList(string $wkb, int &$offset, bool $little, int $dim): array
	{
		$count = self::wkbUint32($wkb, $offset, $little);
		return self::wkbCoords($wkb, $offset, $little, $count, $dim);
	}

	/**
	 * Lee $count puntos de $dim doubles, descartando Z/M. Usa 'e'/'E' (independientes
	 * de la arquitectura) sobre el bloque completo en una sola llamada.
	 *
	 * @return array<int, array{0: float, 1: float}>
	 */
	private static function wkbCoords(string $wkb, int &$offset, bool $little, int $count, int $dim): array
	{
		if ($count === 0)
			return [];
		$doubles = $count * $dim;
		$bytes = $doubles * 8;
		if ($offset + $bytes > strlen($wkb))
			throw new \InvalidArgumentException('WKB inválido: datos insuficientes para las coordenadas.');

		$values = unpack(($little ? 'e' : 'E') . $doubles, $wkb, $offset);
		$offset += $bytes;

		$points = [];
		for ($i = 1; $i <= $doubles; $i += $dim)
			$points[] = [$values[$i], $values[$i + 1]];
		return $points;
	}

	// ------------------------------------------------------------------
	// Lector WKT
	// ------------------------------------------------------------------

	private static function readWkt(string $text, int &$pos, int $depth): GeoGeometry
	{
		if ($depth > self::MAX_NESTING)
			throw new \InvalidArgumentException('WKT inválido: anidamiento excesivo.');

		if (!preg_match('/\G\s*([A-Za-z]+)\s*(ZM|Z|M)?\s*/A', $text, $m, 0, $pos))
			throw new \InvalidArgumentException('WKT inválido: se esperaba el nombre del tipo de geometría.');

		$name = strtoupper($m[1]);
		// El sufijo Z/M puede venir pegado al nombre ('POINTZ'); se interpreta sin él.
		$typesByName = [
			'POINT' => self::POINT, 'LINESTRING' => self::LINESTRING, 'POLYGON' => self::POLYGON,
			'MULTIPOINT' => self::MULTIPOINT, 'MULTILINESTRING' => self::MULTILINESTRING,
			'MULTIPOLYGON' => self::MULTIPOLYGON, 'GEOMETRYCOLLECTION' => self::COLLECTION,
		];
		if (!isset($typesByName[$name]))
			throw new \InvalidArgumentException('WKT inválido: tipo de geometría desconocido (' . $m[1] . ').');
		$type = $typesByName[$name];
		$pos += strlen($m[0]);

		// EMPTY
		if (preg_match('/\GEMPTY\s*/Ai', $text, $m, 0, $pos))
		{
			$pos += strlen($m[0]);
			return $type === self::COLLECTION
				? new GeoGeometry(self::COLLECTION)
				: new GeoGeometry($type, []);
		}

		switch ($type)
		{
			case self::POINT:
				self::wktOpen($text, $pos);
				$point = self::wktPoint2($text, $pos);
				self::wktClose($text, $pos);
				return new GeoGeometry($type, $point);

			case self::LINESTRING:
			case self::MULTIPOINT:
				$points = self::wktPointList($text, $pos, $type === self::MULTIPOINT);
				return new GeoGeometry($type, $points);

			case self::POLYGON:
			case self::MULTILINESTRING:
				return new GeoGeometry($type, self::wktPointListList($text, $pos));

			case self::MULTIPOLYGON:
				self::wktOpen($text, $pos);
				$polygons = [];
				do {
					$polygons[] = self::wktPointListList($text, $pos);
				} while (self::wktComma($text, $pos));
				self::wktClose($text, $pos);
				return new GeoGeometry($type, $polygons);

			case self::COLLECTION:
				self::wktOpen($text, $pos);
				$geometries = [];
				do {
					$geometries[] = self::readWkt($text, $pos, $depth + 1);
				} while (self::wktComma($text, $pos));
				self::wktClose($text, $pos);
				return new GeoGeometry(self::COLLECTION, [], $geometries);
		}
	}

	private static function wktOpen(string $text, int &$pos): void
	{
		if (!preg_match('/\G\s*\(\s*/A', $text, $m, 0, $pos))
			throw new \InvalidArgumentException('WKT inválido: se esperaba "(" en la posición ' . $pos . '.');
		$pos += strlen($m[0]);
	}

	private static function wktClose(string $text, int &$pos): void
	{
		if (!preg_match('/\G\s*\)\s*/A', $text, $m, 0, $pos))
			throw new \InvalidArgumentException('WKT inválido: se esperaba ")" en la posición ' . $pos . '.');
		$pos += strlen($m[0]);
	}

	private static function wktComma(string $text, int &$pos): bool
	{
		if (!preg_match('/\G\s*,\s*/A', $text, $m, 0, $pos))
			return false;
		$pos += strlen($m[0]);
		return true;
	}

	/**
	 * Un punto: 2 a 4 números separados por espacios; solo se conservan x e y.
	 *
	 * @return array{0: float, 1: float}
	 */
	private static function wktPoint2(string $text, int &$pos): array
	{
		if (!preg_match('/\G\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s+([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)(?:\s+[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?){0,2}\s*/A', $text, $m, 0, $pos))
			throw new \InvalidArgumentException('WKT inválido: coordenada incorrecta en la posición ' . $pos . '.');
		$pos += strlen($m[0]);
		return [(float) $m[1], (float) $m[2]];
	}

	/**
	 * '(' punto {',' punto} ')'. En MultiPoint cada punto puede ir o no entre paréntesis.
	 */
	private static function wktPointList(string $text, int &$pos, bool $parenthesizedPoints): array
	{
		self::wktOpen($text, $pos);

		// Camino rápido: lista plana hasta el próximo paréntesis (el caso de anillos y líneas grandes)
		$points = [];
		do {
			if ($parenthesizedPoints && preg_match('/\G\s*\(\s*/A', $text, $m, 0, $pos))
			{
				$pos += strlen($m[0]);
				$points[] = self::wktPoint2($text, $pos);
				self::wktClose($text, $pos);
			}
			else
				$points[] = self::wktPoint2($text, $pos);
		} while (self::wktComma($text, $pos));

		self::wktClose($text, $pos);
		return $points;
	}

	/**
	 * '(' lista {',' lista} ')' donde cada lista es '(' punto {',' punto} ')'.
	 */
	private static function wktPointListList(string $text, int &$pos): array
	{
		self::wktOpen($text, $pos);
		$lists = [];
		do {
			if (preg_match('/\G\s*EMPTY\s*/Ai', $text, $m, 0, $pos))
				$pos += strlen($m[0]);
			else
				$lists[] = self::wktPointList($text, $pos, false);
		} while (self::wktComma($text, $pos));
		self::wktClose($text, $pos);
		return $lists;
	}
}
