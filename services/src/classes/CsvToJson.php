<?php

namespace helena\classes;

use minga\framework\ErrorException;
use helena\classes\spss\Variable;
use minga\framework\Str;

/**
 * Convierte un csv a archivos json manteniendo el formato
 * esperado por el script de python json2spss.py
 *
 * uso:
 * CsvToJson::Convert(nombre de archivo csv, directorio de destino, ...);
 * Si no se pasan los parámetros opcionales intenta detectarlos
 * automáticamente, eso lo hace la clase CsvReader.
 *
 */
class CsvToJson
{
	const MAX_LABELS = 1000;
	const MAX_LENGTH = 32;
	const MIN_LENGTH = 5;

	public static function Convert($filename, $outputPath, $textQualifier = '"',
	  	$delimiter = null, $decimalSeparator = null, $encoding = null)
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

		$csv = null;
		try
		{
			$csv = new CsvReader($textQualifier, $delimiter, $encoding);

			$csv->Open($filename);

			$csvHeaders = $csv->GetHeader();
			$header['varNames'] = self::GetVarNames($csvHeaders);

			foreach($header['varNames'] as $k => $varName)
				$header['varLabels'][$varName] = $csvHeaders[$k];

			$decimal = $decimalSeparator;

			$lengths = [];
			$varFormats = [];
			$fileIndex = 1;

			while($csv->eof == false)
			{
				$data = $csv->GetNextRowsByColumn();
				if($decimal === '' || $decimal === null)
					$decimal = $csv->DetectDecimalSeparator($data);
				foreach($header['varNames'] as $k => $varName)
				{
					$lengths[$varName] = self::GetLengths($data[$k], $lengths, $varName);
					$header['isNumber'][$varName] = self::GetIsNumber($data[$k], $header['isNumber'], $varName, $decimal);
					$header['alignments'][$varName] = self::GetAlignments($header['isNumber'], $varName);
					$varFormats[$varName] = self::GetVarFormatsParts($data[$k], $lengths, $header['isNumber'], $varFormats, $varName);
				}

				$json = json_encode(self::PivotArray($data), JSON_PARTIAL_OUTPUT_ON_ERROR);
				file_put_contents($outputPath . 'data_' . sprintf('%05d', $fileIndex++) . '.json', $json);
			}
			$csv->Close();

			foreach($header['varNames'] as $varName)
				$header = self::HeaderSecondPass($header, $lengths, $varFormats, $varName);

			if(count($header['valueLabels']) == 0)
				$header['valueLabels'] = new \stdClass();

			$json = json_encode($header, JSON_PRETTY_PRINT  | JSON_PARTIAL_OUTPUT_ON_ERROR);
			file_put_contents($outputPath . 'header.json', $json);
			file_put_contents($outputPath . 'data.json', '');
		}
		catch(\Exception $e)
		{
			throw $e;
		}
		finally
		{
			if($csv !== null)
				$csv->Close();
		}
	}

	private static function HeaderSecondPass(array $header, array $lengths, array $varFormats, $varName)
	{
		$header['columnWidths'][$varName] = self::GetColumnWidths($lengths[$varName]);

		$len = $varFormats[$varName];
		if(isset($header['valueLabels'][$varName]))
		{
			if($header['valueLabels'][$varName] === false)
				unset($header['valueLabels'][$varName]);
			else
				$len = [ 'int' => sizeof($header['valueLabels'][$varName]) ];
		}

		$header['varFormats'][$varName] = self::GetVarFormats($len, $header['isNumber'][$varName]);

		$header['varTypes'][$varName] = self::GetVarTypes($header['varFormats'][$varName]);

		$header['measureLevels'][$varName] = self::GetMeasureLevels($header['varFormats'][$varName]);

		return $header;
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
		//Implementar ratio y scale??

		throw new ErrorException('MeasureLevel not implemented: ' . $varFormat);
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

	private static function GetVarFormats(array $formats, $isNumber)
	{
		//Falta implementar el máximo para tipo 'A' es A32767
		if($isNumber === false)
		{
			return 'A' . $formats['int'];
		}
		else
		{
			$ret = 'F' . $formats['int'];
			if($formats['dec'] > 0)
				$ret .= '.' . $formats['dec'];

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
			throw new ErrorException('VarType not implemented: ' . $varFormat);
	}

	/**
	 * Toma todos los campos string y los convierte a campos
	 * de referencia, evita los que puede reconocer como no
	 * string (punto, geometría, etc...)
	 * Si hay más de MAX_LABELS labels, cancela y lo deja
	 * como campo texto.
	 */
	private static function AppendValueLabels(array $col, $valueLabels)
	{
		if($valueLabels === false)
			return false;

		//TODO: ver si hay otros valores fijos de
		//strings que no van a ser ValueLabels.
		if(Str::StartsWithI($col[0], 'POINT')
			|| Str::StartsWithI($col[0], 'MULTIPOINT')
			|| Str::StartsWithI($col[0], 'POLYGON')
			|| Str::StartsWithI($col[0], 'GEOMETRY'))
		{
			return false;
		}

		$unique = array_unique($col);

		$lastKey = 0;
		foreach($valueLabels as $k => $v)
		{
			$i = array_search($v, $unique);
			if($i !== false)
				unset($unique[$i]);
			$lastKey = $k;
		}

		if(count($valueLabels) + count($unique) > self::MAX_LABELS)
			return false;

		$lastKey = (int)$lastKey;
		foreach($unique as $v)
		{
			$newKey = ++$lastKey . '';
			$valueLabels[$newKey] = $v;
		}

		return $valueLabels;
	}

	private static function ReplaceDecimal(array $col)
	{
		return str_replace(',', '.', $col);
	}

	private static function ReplaceValues(array $col, array $valueLabels)
	{
		return str_replace($valueLabels, array_keys($valueLabels), $col);
	}

	private static function GetVarNames(array $names)
	{
		for($i = 0; $i < count($names); $i++)
		{
			$names[$i] = Variable::FixName(trim($names[$i]));

			if($names[$i] == '')
				$names[$i] = 'x';
			elseif(Str::IsNumber($names[$i]) || $names[$i][0] == '_')
				$names[$i] = 'x' . $names[$i];
		}

		return self::NumerateDuplicates($names);
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
		throw new ErrorException('Could not find new name');
	}

}

