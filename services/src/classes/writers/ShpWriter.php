<?php

namespace helena\classes\writers;

use minga\framework\IO;
use minga\framework\Str;
use helena\classes\spss\Format;
use helena\classes\App;
use minga\framework\Zip;

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
		if ($wktIndex !== -1)
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
				$geom = $this->createGeom($polygon);
			}
			else
			{
				$geom = new Point(floatval($row[$iLon]), floatval($row[$iLat]));
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

	private function createGeom($wkt)
	{
		if (Str::StartsWith($wkt, "POLYGON"))
		{
			$ret = new Polygon();
		}
		else if (Str::StartsWith($wkt, "MULTIPOLYGON"))
		{
			$ret = new MultiPolygon();
		}
		else if (Str::StartsWith($wkt, "LINESTRING"))
		{
			$ret = new Linestring();
		}
		else if (Str::StartsWith($wkt, "MULTILINESTRING"))
		{
			$ret = new MultiLinestring();
		}
		else if (Str::StartsWith($wkt, "POINT"))
		{
			$ret = new Point();
		}
		else if (Str::StartsWith($wkt, "MULTIPOINT"))
		{
			$ret = new MultiPoint();
		} else {
			throw new \Exception("Entidad no reconocida: " . ($wkt === null ? 'null' : $wkt));
		}
		$ret->initFromWKT($wkt);
		return $ret;
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

