<?php

namespace helena\services\packs;

use minga\framework\IO;
use helena\classes\SanitizeGeometry;

// Lógica de bajo nivel compartida entre los procesos de alta de
// ClippingRegion y Geography a partir de un GeoPackage ya convertido a
// header.json + data_NNNNN.json (ver GpkgReader). No decide qué tabla ni
// qué columnas de negocio completar: cada servicio arma su propio SQL de
// inserción con los valores que este importador entrega ya resueltos.
class GeoPackageItemsImporter
{
	// Tolerancias de simplificación en metros (algoritmo esférico:
	// distancia perpendicular sobre el elipsoide). Calibradas comparando,
	// polígono por polígono, el tamaño resultante contra el algoritmo de
	// referencia (ver tools/CalibrateSimplify y tools/calibrate-simplify.php).
	const QUALITY_TOLERANCES_M = array(1670.0, 500.0, 228.0, 111.20, 5.56, 0.21);

	public static function ReadColumns($headerFilename)
	{
		$header = json_decode(file_get_contents($headerFilename), true);
		$ret = array();
		foreach ($header['varNames'] as $varName)
		{
			if ($varName !== 'wkt')
			{
				$ret[] = array('VarName' => $varName, 'Label' => $header['varLabels'][$varName]);
			}
		}
		return $ret;
	}

	public static function ReadVarNames($headerFilename)
	{
		$header = json_decode(file_get_contents($headerFilename), true);
		return $header['varNames'];
	}

	public static function CountDataFiles($folder)
	{
		return count(IO::GetFilesStartsWith($folder, 'data_'));
	}

	public static function GetDataFile($folder, $index)
	{
		$files = IO::GetFilesStartsWith($folder, 'data_');
		sort($files);
		return $folder . '/' . $files[$index];
	}

	public static function ReadDataFile($filename)
	{
		return json_decode(file_get_contents($filename), true);
	}

	// Una geometría inválida en el archivo de origen no debe abortar todo
	// el import: se devuelve null y el que llama decide si saltea esa fila.
	public static function SimplifyToTolerances($wkt, $tolerances)
	{
		if ($wkt === null || $wkt === '')
		{
			return null;
		}
		$ret = array();
		try
		{
			foreach ($tolerances as $tolerance)
			{
				$simplified = SanitizeGeometry::SanitizeString($wkt, $tolerance);
				if ($simplified === null)
				{
					return null;
				}
				$ret[] = $simplified;
			}
		}
		catch (\Exception $e)
		{
			return null;
		}
		return $ret;
	}
}
