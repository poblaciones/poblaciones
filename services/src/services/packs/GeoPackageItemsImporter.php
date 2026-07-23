<?php

namespace helena\services\packs;

use minga\framework\IO;
use helena\classes\SanitizeGeometry;

// Lógica de bajo nivel compartida entre los procesos de alta de
// ClippingRegion y Geography a partir de un GeoPackage ya convertido a
// header.json + data_NNNNN.json (ver GpkgReader). No decide qué tabla ni
// qué columnas de negocio completar: cada servicio arma su propio SQL de
// inserción con los valores que este importador le entrega ya resueltos.
class GeoPackageItemsImporter
{
	// Tolerancias de simplificación (metros, algoritmo esférico real —
	// distancia perpendicular sobre el elipsoide, no Douglas-Peucker
	// plano en grados). Son la tabla de calidad de SimplifyGeometry::$quality
	// (índice 1..6, 'peor calidad' a 'mejor calidad'), ya calibrada y en
	// uso en el sistema (SnapshotByDatasetTileData, simplificación de
	// datasets por nivel de zoom). El WinForms original usaba OTRO
	// algoritmo (Douglas-Peucker plano, tolerancia en grados decimales,
	// ver Simplifications.cs) — sus valores no son trasladables
	// directamente a este algoritmo esférico, distinto en su naturaleza
	// matemática, no solo en la unidad. Uso esta tabla por ser la mejor
	// referencia disponible ya calibrada en PHP con el algoritmo esférico
	// correcto (mismos 6 nombres de nivel que el enum QualityEnum del
	// WinForms), pero no tengo confirmación de que haya sido calibrada
	// específicamente para este propósito (geometrías de items
	// administrativos) — HABRÍA QUE VALIDARLA/AJUSTARLA comparando contra
	// resultados reales del WinForms antes de darla por buena en
	// producción.
	const QUALITY_TOLERANCES_M = array(1550.0, 450.0, 300.0, 200.0, 55.0, 35.0);

	// Devuelve las columnas del archivo ya convertido, con su nombre
	// original (Label, lo que ve el usuario para mapear) y su nombre
	// interno (VarName, la clave usada en cada fila de data_NNNNN.json).
	// Excluye la columna de geometría ('wkt'), que no es mapeable.
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

	// Índice, dentro de una fila de data_NNNNN.json, de cada varName
	// declarado en el header (mismo orden).
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

	// Simplifica un WKT a cada una de las tolerancias indicadas (en
	// metros), en el mismo orden. Una geometría inválida no debe abortar
	// todo el import: se devuelve null y el servicio decide si saltea esa
	// fila.
	public static function SimplifyToTolerances($wkt, $tolerances)
	{
		if ($wkt === null || $wkt === '')
			return null;
		$ret = array();
		try
		{
			foreach ($tolerances as $tolerance)
			{
				$simplified = SanitizeGeometry::SanitizeString($wkt, $tolerance);
				if ($simplified === null)
					return null;
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
