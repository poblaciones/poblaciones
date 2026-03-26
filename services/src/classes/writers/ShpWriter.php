<?php

namespace helena\classes\writers;

use minga\framework\IO;
use minga\framework\Str;
use helena\classes\spss\Format;
use helena\classes\App;
use minga\framework\Zip;
use minga\framework\ErrorException;


use Shapefile\Shapefile;
use Shapefile\ShapefileWriter;
use Shapefile\Geometry\Point;
use Shapefile\Geometry\MultiPoint;
use Shapefile\Geometry\Linestring;
use Shapefile\Geometry\MultiLinestring;
use Shapefile\Geometry\Polygon;
use Shapefile\Geometry\MultiPolygon;

class ShpWriter extends BaseWriter
{
	const PRJ = "GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433],METADATA[\"World\",-180.0,-90.0,180.0,90.0,0.0,0.0174532925199433,0.0,1262]]";
	const ENCODING = "UTF-8";
	private $cols;

	public function SaveHeader()
	{
		$this->cols = $this->state->Cols();

		// Empieza a crear los archivos
		$shapeFile = $this->resolveShapeFile();
    $Shapefile = new ShapefileWriter($shapeFile, [Shapefile::OPTION_EXISTING_FILES_MODE  => Shapefile::MODE_OVERWRITE]);

    // Setea el tipo
		$wktIndex = $this->model->wktIndex;
		if ($this->state->AreSegments())
		{
			$Shapefile->setShapeType(Shapefile::SHAPE_TYPE_POLYLINE);
		}
		else if ($wktIndex !== -1)
		{
	    $Shapefile->setShapeType(Shapefile::SHAPE_TYPE_POLYGON);
		}
		else
		{
		  $Shapefile->setShapeType(Shapefile::SHAPE_TYPE_POINT);
		}
    $Shapefile->setPRJ(self::PRJ);
		$Shapefile->setCharset(self::ENCODING);

		$cols = $this->cols;
		$this->ProcessColumns($Shapefile, $cols);
		$Shapefile = null;
	}

	public function PageData()
	{
		$rows = $this->GetRowsAndIncrementSlice();
		if(count($rows) === 0) return false;

		$shapeFile = $this->resolveShapeFile();
	  $Shapefile = new ShapefileWriter($shapeFile, [Shapefile::OPTION_EXISTING_FILES_MODE  => Shapefile::MODE_APPEND,
			Shapefile::OPTION_BUFFERED_RECORDS => 100,
			Shapefile::OPTION_ENFORCE_GEOMETRY_DATA_STRUCTURE => false]);
		$Shapefile->setCharset(self::ENCODING);

		$wktIndex = $this->model->wktIndex;
		$cols = $this->state->Cols();
		if ($wktIndex === -1)
		{
			$iLat = $this->getColumnByVariable($this->state->Get('latVariable'));
			$iLon = $this->getColumnByVariable($this->state->Get('lonVariable'));
		}
		else
		{
			$iLat = -1;
			$iLon = -1;
		}
		$f = 0;
		foreach($rows as &$row)
		{
			$f++;
			$geom = null;
			if ($wktIndex !== -1)
			{
				// rearma el polígono
				$polygon = $row[$wktIndex];
				$geom = self::createGeom($polygon);
			}
			else
			{
				$geom = new Point($this->parseCoord($row[$iLon]), $this->parseCoord($row[$iLat]));
			}
			if ($geom !== null)
			{
				$this->AddFieldData($cols, $row, $geom, $wktIndex);
				$Shapefile->writeRecord($geom);
			}
		}
		$Shapefile = null;

		$this->state->Increment('index');

		return true;
	}

	private function parseCoord($coord)
	{
		$coord = '' . $coord;
		$coord = Str::Replace($coord, ",", ".");
		if (!Str::Contains($coord, "°"))
		{
			return floatVal($coord);
		}

		$dms = Str::ToUpper(trim($coord));

		$deg = mb_substr($dms, 0, mb_strpos($dms, '°'));
		$mins = mb_substr($dms, mb_strpos($dms, '°') + 1, mb_strpos($dms, "'") - mb_strpos($dms, '°') - 1);
		$secs = mb_substr($dms, mb_strpos($dms, "'") + 1, mb_strpos($dms, '"') - mb_strpos($dms, "'") - 1);

		$sign = 1 - 2 * (Str::Contains($dms, 'W') || Str::Contains($dms, 'S') || Str::Contains($dms, 'O'));

		return $sign * (floatVal($deg) + floatVal($mins) / 60 + floatVal($secs) / 3600);
	}


	private function AddFieldData($cols, $row, $geom, $wktIndex)
	{
		$i = 0;
		foreach($cols as $col)
		{
			if ($wktIndex !== $i)
			{
				if ($col['format'] != Format::F)
				{
					$val = $row[$i];
				}
				else
				{
					$val = $row[$i];
				}
				if (strlen($val) > 254)
				{
					$val = substr($val, 0, 254);
				}
				$geom->setData($col['effectiveVariable'], $val);
			}
			$i++;
			if ($i == Shapefile::DBF_MAX_FIELD_COUNT)
				break;
		}
	}
	public function Flush()
	{
		$codepageFile = $this->resolveBaseName() . '.cpg';
		IO::WriteAllText($codepageFile, self::ENCODING);
		$prjFile = $this->resolveBaseName() . '.prj';
		IO::WriteAllText($prjFile, self::PRJ);

		$zipFile = $this->state->Get('outFile');
		$zip = new Zip($zipFile);
		$friendlyNoExtension = $this->resolveBaseName();
		$files = array($friendlyNoExtension . '.dbf', $friendlyNoExtension . '.prj',
															$friendlyNoExtension . '.shp', $friendlyNoExtension . '.shx');
		if (file_exists($friendlyNoExtension . '.cpg'))
			$files[] =  $friendlyNoExtension . '.cpg';
		if (file_exists($friendlyNoExtension . '.dbt'))
			$files[] =  $friendlyNoExtension . '.dbt';

		$dir = $this->resolveDirectory();
		$zip->AddToZip($dir, $files);
	}

	private function resolveShapeFile()
	{
		$shapeFile = $this->resolveBaseName() . '.shp';
		return $shapeFile;
	}
	private function resolveDirectory()
	{
		return dirname($this->state->Get('outFile'));
	}
	private function resolveBaseName()
	{
		$dir = $this->resolveDirectory();
		$friendly = $this->state->Get('friendlyName');
		$friendlyNoExtension = $dir . '/' . substr($friendly, 0, strlen($friendly) - 4);
		return $friendlyNoExtension;
	}

	public static function createGeom($wkt)
	{
		try {
			$ret = self::instantiateGeom($wkt);
			$ret->initFromWKT($wkt);
		} catch (\Exception $e) {
			if (str_contains($e->getMessage(), 'Ring area too small')) {
				// Intentar sanitizar y reintentar
				try {
					$cleanWkt = self::sanitizeRings($wkt);
					$ret = self::instantiateGeom($cleanWkt);
					$ret->initFromWKT($cleanWkt);
				} catch (\Exception $e2) {
					$err = 'No pudo reconstruir la geometría incluso después de sanitizar. '
						. "Antes: \n" . $wkt . "\n\nDespués: \n" . $cleanWkt . "\n\n Error antes: " . $e->getMessage()
						. "\n Error después: " . $e2->getMessage();
					throw new ErrorException(
						$err);
				}
			} else {
				throw new ErrorException(
					'No pudo reconstruir la geometría obtenida desde la base de datos: '
					. $wkt . '. Error: ' . $e->getMessage()
				);
			}
		}
		return $ret;
	}

	private static function instantiateGeom($wkt)
	{
		if (Str::startsWith($wkt, 'MULTIPOLYGON'))
			return new MultiPolygon();
		if (Str::startsWith($wkt, 'POLYGON'))
			return new Polygon();
		if (Str::startsWith($wkt, 'MULTILINESTRING'))
			return new MultiLinestring();
		if (Str::startsWith($wkt, 'LINESTRING'))
			return new Linestring();
		if (Str::startsWith($wkt, 'MULTIPOINT'))
			return new MultiPoint();
		if (Str::startsWith($wkt, 'POINT'))
			return new Point();
		throw new \Exception('Entidad no reconocida: ' . ($wkt === null ? 'null' : $wkt));
	}

	private static function sanitizeRings(string $wkt, float $minRange = 1e-6): string
	{
		// Para MULTIPOLYGON: elimina sub-polígonos degenerados
		if (Str::startsWith($wkt, 'MULTIPOLYGON')) {
			return self::sanitizeMultiPolygon($wkt, $minRange);
		}
		// Para POLYGON: elimina anillos interiores (huecos) degenerados
		if (Str::startsWith($wkt, 'POLYGON')) {
			return self::sanitizePolygon($wkt, $minRange);
		}
		return $wkt;
	}
	private static function sanitizeMultiPolygon(string $wkt, float $minRange): string
	{
		// Extraer sub-polígonos contando paréntesis en lugar de usar regex
		$innerStart = strpos($wkt, '(');
		if ($innerStart === false)
			return $wkt;

		// El contenido entre el primer '(' y el último ')'
		$inner = substr($wkt, $innerStart + 1, strlen($wkt) - $innerStart - 2);

		$polygons = self::extractTopLevelParenGroups($inner);

		$valid = array_filter($polygons, fn($poly) => self::ringIsValid($poly, $minRange));

		if (empty($valid)) {
			throw new \Exception('Todos los sub-polígonos del MULTIPOLYGON son degenerados');
		}

		return 'MULTIPOLYGON(' . implode(',', $valid) . ')';
	}

	/**
	 * Extrae grupos de paréntesis de nivel superior de una cadena.
	 * Ej: "((...)),((...))" → ["((...))","((...))" ]
	 */
	private static function extractTopLevelParenGroups(string $str): array
	{
		$groups = [];
		$depth = 0;
		$start = null;
		$len = strlen($str);

		for ($i = 0; $i < $len; $i++) {
			$ch = $str[$i];
			if ($ch === '(') {
				if ($depth === 0) {
					$start = $i;
				}
				$depth++;
			} elseif ($ch === ')') {
				$depth--;
				if ($depth === 0 && $start !== null) {
					$groups[] = substr($str, $start, $i - $start + 1);
					$start = null;
				}
			}
		}

		return $groups;
	}
	private static function sanitizePolygon(string $wkt, float $minRange): string
	{
		// Extrae contenido dentro de POLYGON(...)
		if (!preg_match('/^POLYGON\s*\((.+)\)$/s', $wkt, $outer)) {
			return $wkt;
		}

		// Separa los anillos: el primero es el exterior, el resto son huecos
		preg_match_all('/\(([^()]+)\)/', $outer[1], $rings);

		$validRings = [];
		foreach ($rings[0] as $index => $ring) {
			// Siempre conservar el anillo exterior (índice 0)
			if ($index === 0 || self::ringIsValid($ring, $minRange)) {
				$validRings[] = $ring;
			}
		}

		return 'POLYGON(' . implode(',', $validRings) . ')';
	}

	private static function ringIsValid(string $ringWkt, float $minRange): bool
	{
		preg_match_all('/-?\d+(?:\.\d+)?/', $ringWkt, $nums);
		$xs = $ys = [];
		for ($i = 0; $i + 1 < count($nums[0]); $i += 2) {
			$xs[] = (float) $nums[0][$i];
			$ys[] = (float) $nums[0][$i + 1];
		}
		if (empty($xs))
			return false;
		return (max($xs) - min($xs)) >= $minRange
			|| (max($ys) - min($ys)) >= $minRange;
	}

	private function getColumnByVariable($variable)
	{
		// Agrega columnas
		$cols = $this->state->Cols();
		$i = 0;
		foreach($cols as $col)
		{
			if ($col['variable'] === $variable)
				return $i;
			$i++;
		}
		return -1;
	}

	private function ProcessColumns($Shapefile, &$cols)
	{
		$wktIndex = $this->model->wktIndex;
		$i = 0;
		// Agrega columnas
		foreach($cols as &$col)
		{
			if ($wktIndex !== $i)
			{
				$width = $col['field_width'] + 1; // agrega uno más por si hay negativos
				$decimals = $col['decimals'];
				if ($decimals > 0)
					$width++; // agrega uno más por el separador

				if ($col['format'] == Format::F)
				{
					$varName = $Shapefile->addNumericField($col['variable'], $width, $decimals);
				}
				else if ($width < 255)
				{
					$varName = $Shapefile->addCharField($col['variable'], $width);
				}
				else
				{
					$varName = $Shapefile->addCharField($col['variable'], 254);
				}
				$this->state->state['cols'][$i]['effectiveVariable'] = $varName;
			}
			$i++;
			if ($i == Shapefile::DBF_MAX_FIELD_COUNT)
				break;
		}
	}
}

