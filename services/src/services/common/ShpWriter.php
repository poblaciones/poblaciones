<?php

namespace helena\services\common;

use minga\framework\IO;
use minga\framework\Str;
use helena\classes\spss\Format;
use minga\framework\Zip;

use Shapefile\Shapefile;
use Shapefile\ShapefileWriter;
use Shapefile\Geometry\Point;
use Shapefile\Geometry\MultiPoint;
use Shapefile\Geometry\Linestring;
use Shapefile\Geometry\MultiLinestring;
use Shapefile\Geometry\Polygon;
use Shapefile\Geometry\MultiPolygon;

class ShpWriter extends JsonWriter
{
	const PRJ = "GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137.0,298.257223563]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433],METADATA[\"World\",-180.0,-90.0,180.0,90.0,0.0,0.0174532925199433,0.0,1262]]";
	private $cols;

	public function Flush()
	{
		$dir = dirname($this->state->Get('outFile'));
		$friendly = $this->state->Get('friendlyName');
		$friendlyNoExtension = $dir . '/' . substr($friendly, 0, strlen($friendly) - 4);
		$zipFile = $this->state->Get('outFile');
		$shapeFile =  $friendlyNoExtension . '.shp';
		$this->cols = $this->state->Cols();

		// Empieza a crear los archivos
    $Shapefile = new ShapefileWriter($shapeFile, [Shapefile::OPTION_OVERWRITE_EXISTING_FILES  => true]);

    // Setea el tipo
		$wktIndex = $this->model->wktIndex;
		if ($wktIndex !== -1)
		{
	    $Shapefile->setShapeType(Shapefile::SHAPE_TYPE_POLYGON);
		}
		else
		{
		  $Shapefile->setShapeType(Shapefile::SHAPE_TYPE_POINT);
			$iLat = $this->getColumnByVariable($this->state->Get('latVariable'));
			$iLon = $this->getColumnByVariable($this->state->Get('lonVariable'));
		}
    $Shapefile->setPRJ(self::PRJ);

		$cols = $this->cols;
		$this->ProcessColumns($Shapefile, $cols);

		// Ya armó la estructura
		$q = 0;
		foreach(IO::GetFilesStartsWith($dir, 'intermediate_data_', true) as $file)
		{
			$data = IO::ReadJson($file);
			foreach($data as $row)
			{
//				Profiling::BeginTimer('PrepareRecord');
				$geom = null;
				if ($wktIndex !== -1)
				{
					// rearma el polígono
					$polygon = $row[$wktIndex];
					$geom = $this->createGeom($polygon);
				} else {
					$geom = new Point(floatval($row[$iLon]), floatval($row[$iLat]));
				}
				$i = 0;
				foreach($cols as $col)
				{
					if ($wktIndex !== $i)
					{

				if ($col['format'] != Format::F)
				{
	//				Profiling::BeginTimer('utf8_decode');

						$val = utf8_decode($row[$i]);
		//		Profiling::EndTimer();
				}
				else
				{
					$val = strval($row[$i]);
				}
						if (strlen($val) > 254)
						{
							$val = substr($val, 0, 254);
						}
						$geom->setData($col['effectiveVariable'], $val);
					}
					$i++;
				}
			//	Profiling::EndTimer();
		    $Shapefile->writeRecord($geom);
			}
			$q++;
		}

		$Shapefile = null;

		$zip = new Zip($zipFile);
		$files = array($friendlyNoExtension . '.dbf', $friendlyNoExtension . '.prj',
															$friendlyNoExtension . '.shp', $friendlyNoExtension . '.shx');
		if (file_exists($friendlyNoExtension . '.cpg'))
			$files[] =  $friendlyNoExtension . '.cpg';
		if (file_exists($friendlyNoExtension . '.cpg'))
			$files[] =  $friendlyNoExtension . '.dbt';

		$zip->AddToZip($dir, $files);
		//throw new \Exception('aaa');

		$this->state->SetStep(DownloadManager::STEP_DATA_COMPLETE, 'Descargando archivo');
		$this->state->Save();
	}
	private function createGeom($wkt)
	{
//		Profiling::BeginTimer();
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
		}
		else
			throw new \Exception("Entidad no reconocida.");

		$ret->initFromWKT($wkt);
		//Profiling::EndTimer();
		return $ret;
	}

	private function getColumnByVariable($variable)
	{
		// Agrega columnas
		$cols = $this->cols;
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
				$varName = $this->fixVarName($col['variable'], $cols);
				$col['effectiveVariable'] = $varName;

				$width = $col['field_width'];
				$decimals = $col['decimals'];

				if ($col['format'] == Format::F)
				{
					$Shapefile->addNumericField($varName, $width, $decimals);
				}
				else if ($width < 255)
				{
					$Shapefile->addCharField($varName, $width);
				}
				else
				{
					$Shapefile->addCharField($varName, 254);
				}
			}
			$i++;
		}
	}

	private function fixVarName($name, $cols)
	{
		$n = 0;
		$name = strtoupper($name);
		$candidate = $nCandidate = $this->sanitizeDBFFieldName($name);
		while($this->variableExists($nCandidate, $cols))
		{
			$n++;
			$nCandidate = $this->appendNumber($candidate, $n);
		}
		return $nCandidate;
	}

	private function variableExists($cad, $cols)
  {
		foreach($cols as $col)
			if (isset($col['effectiveVariable']) && $col['effectiveVariable'] === $cad)
				return true;
		return false;
	}

	private function appendNumber($cad, $n)
  {
		$futureLength = strlen($cad . '_' . $n);
		if ($futureLength > 10)
			$cad = substr($cad, 0, strlen($cad) - ($futureLength - 10));
		return $cad . '_' . $n;
  }

	private function sanitizeDBFFieldName($input)
  {
      if ($input === '') {
          return $input;
      }
      $ret = substr(preg_replace('/[^a-zA-Z0-9]/', '_', $input), 0, 10);
      return $ret;
  }
}

