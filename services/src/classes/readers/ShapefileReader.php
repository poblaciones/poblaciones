<?php

namespace helena\classes\readers;

use minga\framework\PublicException;
use minga\framework\IO;
use minga\framework\Zip;
use helena\classes\App;
use minga\framework\Log;

use helena\classes\Projections;

use helena\classes\spss\Variable;
use minga\framework\Str;

use Shapefile\Shapefile;
use Shapefile\ShapefileReader as GaspareFileReader;
use helena\classes\shapefile\FastShapeFileReader;

/**
 * Convierte un csv a archivos json manteniendo el formato
 * esperado por el script de python json2spss.py
 *
 * uso:
 *
 * CsvReader::Convert(nombre de archivo csv, directorio de destino, ...);
 * Si no se pasan los parámetros opcionales intenta detectarlos
 * automáticamente, eso lo hace la clase CsvParser.
 *
 */

class ShapefileReader extends BaseReader
{
	const MAX_LENGTH = 32;
	const MIN_LENGTH = 5;
	const MAX_ROWS = 5000;

	public function WriteJson($selectedSheetIndex)
	{
		if (Str::EndsWith($this->extension, "zip"))
		{
			// expande y busca el shapefile ...
			$zip = new Zip($this->sourceFile);
			$folder = $this->sourceFile . ".shapefile";
			$zip->Extract($folder);
			$masterFile = self::FindMasterFile($folder);
			if (!$masterFile)
				throw new PublicException("El archivo indicado no posee un archivo con extensión .shp.");
		}
		else
			$masterFile = $this->sourceFile;

		self::Convert($masterFile, $this->folder);
	}

	public function CanGeoreference()
	{
		return 2;
	}

	public static function Convert($filename, $outputPath)
	{
		if (Str::EndsWith($outputPath, "\\") == false &&
				Str::EndsWith($outputPath, "/") == false)
				$outputPath .= "/";

		$header = [
			'varNames' => [],
			'varTypes' => [],
			'varLabels' => [],
			'varFormats' => [],
			'columnWidths' => [],
			'isNumber' => [],
			'measureLevels' => [],
			'alignments' => [],
			'valueLabels' => [],
		];

		$dbfExists = true;
		if (Str::EndsWith(Str::ToLower($filename), ".shp"))
		{
			$dbfFile = substr($filename, 0, strlen($filename) - 3) . "dbf";
			$dbfExists = IO::Exists($dbfFile);
		}
		$options = [];
		if (!$dbfExists)
			 $options[Shapefile::OPTION_IGNORE_FILE_DBF] = true;

		$shapefile = new FastShapeFileReader($filename, $options);

		$shapeType = $shapefile->getShapeType(Shapefile::FORMAT_STR);
		$useLatLong = ($shapeType === "Point");

	  $projection = $shapefile->getPRJ();

		$shapefileHeaders = $shapefile->getFields();

		$keys = array_keys($shapefileHeaders);
		$names =  self::GetVarNames($keys);
		$header['varNames'] = $names;

		for($i = 0; $i < count($names); $i++)
		{
			$varName = $names[$i];
			$fieldInfo = $shapefileHeaders[$keys[$i]];
			$header['isNumber'][$varName] = $fieldInfo['type'] === 'N';
			$header['columnWidths'][$varName] = self::GetColumnWidths($fieldInfo['size']);
			$header['varFormats'][$varName] = self::GetVarFormats($header['isNumber'][$varName], $fieldInfo['size'], $fieldInfo['decimals']);
			self::CompleteColumnAttributes($header, $varName, null);
		}

		if ($useLatLong)
		{
			$header['varNames'][] = 'latitud';
			$header['varNames'][] = 'longitud';
			$header['varNames'] = self::NumerateDuplicates($header['varNames']);
			$latColumn = $header['varNames'][sizeof($header['varNames']) - 2];
			$lonColumn = $header['varNames'][sizeof($header['varNames']) - 1];
			self::FormatCoordinateColumn($header, $latColumn, 'Latitud de la ubicación');
			self::FormatCoordinateColumn($header, $lonColumn, 'Longitud de la ubicación');
		}
		else
		{
			$header['varNames'][] = 'wkt';
			$header['varNames'] = self::NumerateDuplicates($header['varNames']);
			$geomColumn = $header['varNames'][sizeof($header['varNames']) - 1];
			self::FormatTextColumn($header, $geomColumn, 'WKT con polígonos', 100000);
		}

		$header['valueLabels'] = new \stdClass();

		$json = json_encode($header, JSON_PRETTY_PRINT  | JSON_PARTIAL_OUTPUT_ON_ERROR);
		file_put_contents($outputPath . 'header.json', $json);

		$rows = [];
		$fileNumber = 1;
		$rowsAdded = 0;
		$totalrowsAdded = 0;

		$crsFrom = $projection;
		$crsTo = "epsg:4326";
		$needsProjection = !Str::Contains($crsFrom, "GCS_WGS_1984");

		try
		{
			$projector = new Projections($crsFrom, $crsTo);
		}
		catch(\Exception $e)
		{
			$log = "La proyección indicada no fue reconocida: " . $crsFrom;
			Log::HandleSilentException(new PublicException($log));
			throw new PublicException("La proyección indicada no fue reconocida. Procure convertir la información a GCS_WGS_1984 antes de importarla.");
		}

		if (!$crsFrom)
			throw new PublicException("No pudo identificarse la proyección del archivo.");

		while ($geometry = $shapefile->fetchRecord()) {
      if (!$geometry->isDeleted()) {
				$data = $geometry->getDataArray();
				$values = array_values($data);

				// proyecta la geometría
				if ($needsProjection)
					$projected = $projector->ProjectGeometry($geometry);
				else
					$projected = $geometry;

				if ($useLatLong)
				{
					$point = $projected->getArray();
					$values[] = $point['y'];
					$values[] = $point['x'];
				}
				else
				{
					$values[] = $projected->getWKT();
				}
				$rows[] = $values;
				$rowsAdded++;
				$totalrowsAdded++;
				if ($rowsAdded > self::MAX_ROWS)
				{
					self::SaveData($outputPath, $fileNumber, $rows);
					$rows = [];
					$fileNumber++;
					$rowsAdded = 0;
				}
			}
		}
		$shapefile = null;
		if ($rowsAdded > 0 || $fileNumber == 1)
			self::SaveData($outputPath, $fileNumber, $rows);
	}
	private static function SaveData($outputPath, $fileNumber, $rows)
	{
		$file = $outputPath . 'data_' . str_pad($fileNumber, 5, "0", STR_PAD_LEFT) . '.json';
		file_put_contents($file, json_encode($rows));
	}
	private static function CompleteColumnAttributes(&$header, $varName, $caption)
	{
		$header['varTypes'][$varName] = self::GetVarTypes($header['varFormats'][$varName]);
		$header['measureLevels'][$varName] = self::GetMeasureLevels($header['varFormats'][$varName]);
		$header['varLabels'][$varName] = $caption;
		$header['alignments'][$varName] = self::GetAlignments($header['isNumber'], $varName);
	}

	private static function FormatCoordinateColumn(&$header, $col, $label)
	{
		$header['isNumber'][$col] = true;
		$header['columnWidths'][$col] = 10;
		$header['varFormats'][$col] = self::GetVarFormats(true, 10, 6);
		self::CompleteColumnAttributes($header, $col, $label);
	}

	private static function FormatTextColumn(&$header, $col, $label, $size)
	{
		$header['isNumber'][$col] = false;
		$header['columnWidths'][$col] = $size;
		$header['varFormats'][$col] = self::GetVarFormats(false, $size, 0);
		self::CompleteColumnAttributes($header, $col, $label);
		if ($size > 100) $header['columnWidths'][$col] = 100;
	}

	private static function PivotArray(array $data)
	{
		$res = [];
		foreach($data as $k => $col)
			foreach($col as $i => $value)
				$res[$i][$k] = $value;

		return $res;
	}

	private static function GetLengths(array $col, $lengths, $varName)
	{
		if(isset($lengths[$varName]) == false)
			$lengths[$varName] = 0;

		$lens = array_map('strlen', $col);
		return max(max($lens), $lengths[$varName]);
	}

	private static function GetColumnWidths($length)
	{
		if($length > self::MAX_LENGTH)
			return self::MAX_LENGTH;
		else if($length < self::MIN_LENGTH)
			return self::MIN_LENGTH;
		else
			return $length;
	}

	private static function GetAlignments($isNumberList, $varName)
	{
		if ($isNumberList[$varName])
			return 'right';
		else
			return 'left';
	}

	private static function GetIsNumber(array $col, array $isNumberList, $varName, $decimal)
	{
		if(isset($isNumberList[$varName]) && $isNumberList[$varName] == false)
			return false;
		$allAreEmpty = true;
		foreach($col as $value)
		{
			$val = trim($value);
			if($val != '')
			{
				$allAreEmpty = false;
				if ($decimal != '.') $val = Str::Replace($val, $decimal, ".");
				if (Str::IsNumberNotPlaceheld($val) === false)
					return false;
			}
		}
		if ($allAreEmpty)
			return false;
		else
			return true;
	}

	private static function GetMeasureLevels($varFormat)
	{
		if($varFormat[0] == 'F')
			return 'ratio';
		else if($varFormat[0] == 'A')
			return 'nominal';

		throw new PublicException('El nivel de medida indicado no está soportado (' . $varFormat . ')');
	}

	private static function GetVarFormatsParts(array $col, $lengths, $isNumberList, $prev, $varName)
	{
		if(isset($prev[$varName]['int']) == false)
			$prev[$varName] = ['int' => 0, 'dec' => 0];

		if($isNumberList[$varName] === false)
		{	// Es de texto
			return [
				'int' => max($prev[$varName]['int'], $lengths[$varName]),
				'dec' => 0,
		  	];
		}

		// Es numérica
		if($prev[$varName]['int'] == 40
			&& $prev[$varName]['dec'] == 15)
			return $prev[$varName];

		$unique = array_unique($col);

		$int = 0;
		$dec = 0;

		foreach($unique as $value)
		{
			if(Str::StartsWith($value, '-'))
				$value = substr($value, 1);

			if(Str::Contains($value, '.'))
			{
				$parts = explode('.', $value);
				$int = max($int, strlen($parts[0]));
				if($dec < 15)
				{
					$decimals = rtrim($parts[1], "0");
					$dec = min(15, max($dec, strlen($decimals)));
				}
			}
			else
				$int = max($int, strlen($value));
		}


		return [
			'int' => min(40, max($prev[$varName]['int'], $int + $dec)),
			'dec' => max($prev[$varName]['dec'], $dec),
		];
	}

	private static function GetVarFormats($isNumber, $size, $decimals)
	{
		//Falta implementar el máximo para tipo 'A' es A32767
		if($isNumber === false)
		{
			return 'A' . $size;
		}
		else
		{
			$ret = 'F' . $size;
			if($decimals > 0)
				$ret .= '.' . $decimals;

			return $ret;
		}
	}

	private static function GetVarTypes($varFormat)
	{
		if($varFormat[0] == 'F')
			return 0;
		else if($varFormat[0] == 'A')
			return (int)substr($varFormat, 1);
		else
			throw new PublicException('El tipo de variable indicado no está soportado (' . $varFormat . ')');
	}

	private static function GetVarNames(array $names)
	{
		$ret = [];
		for($i = 0; $i < count($names); $i++)
		{
			$varname =  mb_strtolower(trim($names[$i]));
			if ($varname === '')
				break;
			$names[$i] = Variable::FixName($varname);
			if($names[$i] == '')
				$names[$i] = 'x';
			elseif(Str::IsNumber($names[$i]) || $names[$i][0] == '_')
				$names[$i] = 'x' . $names[$i];
			$ret[] = $names[$i];
		}

		return self::NumerateDuplicates($ret);
	}

	private static function NumerateDuplicates($names)
	{
		$uniqueNames = array_unique($names);
		if(count($names) == count($uniqueNames))
			return $names;

		for($i = 0; $i < count($names); $i++)
		{
			$k = array_search($names[$i], $uniqueNames);
			if($k === false)
				$names[$i] = self::GetNewName($names, $names[$i]);
			else
				unset($uniqueNames[$k]);
		}
		return $names;
	}

	private static function GetNewName(array $names, $name)
	{
		for($i = 1; $i < 101; $i++)
		{
			$newName = $name . $i;
			if(in_array($newName, $names) == false)
				return $newName;
		}
		throw new PublicException('No ha sido posible calcular un nuevo nombre');
	}

	private static function FindMasterFile($folder, $recurse = true)
	{
		foreach(IO::GetFiles($folder, '.shp', true) as $file)
		{
			$nameOnly = IO::GetFilenameNoExtension($file);
			// Chequea al candidato...
		//	$dbf = self::GetFilenameFromShp($file, 'dbf');
			$prj = self::GetFilenameFromShp($file, 'prj');
		//	if (!file_exists($dbf))
		//		throw new PublicException("El archivo " . $nameOnly .".shp debe estar acompañado de un archivo con los atributos (extensión esperada: dbf).");
			if (!file_exists($prj))
				throw new PublicException("El archivo " . $nameOnly .".shp debe estar acompañado de un archivo con la proyección de extensión (extensión esperada: prj).");
			return $file;
		}

		if ($recurse)
			foreach(IO::GetDirectories($folder,'', true) as $subfolder)
			{
				$ret = self::FindMasterFile($subfolder, false);
				if ($ret)
					return $ret;
			}
		return null;
	}

	private static function GetFilenameFromShp($shapeFile, $ext)
	{
		$fileNoExt = substr($shapeFile, 0, strlen($shapeFile) - 3);
		if (file_exists($fileNoExt . strtoupper($ext)))
			return $fileNoExt . strtoupper($ext);
		else
			return $fileNoExt . $ext;
	}
}

