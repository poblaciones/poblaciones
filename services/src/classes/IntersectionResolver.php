<?php

namespace helena\classes;

use minga\framework\IO;
use minga\framework\PublicException;

// Encapsula la invocación a resolve_intersections.py (Shapely + pyproj):
// MySQL 5.7 no puede calcular ST_Intersection de forma confiable para
// polígonos complejos con bordes casi-coincidentes (error 3122
// 'Inconsistent intersection points', reproducible incluso con
// geometrías válidas y sin buffer(0) de por medio, confirmado a mano
// antes de llegar a este diseño). Se reemplaza ese cálculo puntual por
// Python, manteniendo en SQL solo el filtro grueso por índice espacial
// (MBRIntersects contra snapshot_geography_item), que sí funciona bien.
//
// Se usa tanto desde ClippingRegionService (intersecciones con
// Geography) como desde GeographyTupleService (equivalencias entre
// geografías): el cálculo geométrico es el mismo problema en ambos
// casos, solo cambia qué se hace con el resultado.
class IntersectionResolver
{
	// $baseWkt: geometría de referencia (ej. un departamento, o un ítem
	// de la geografía actual).
	// $candidates: array de {id, wkt} ya filtrados por MBRIntersects (no
	// hace falta pasarle todo el universo, solo los que ya pasaron el
	// filtro grueso del índice espacial).
	// Devuelve array('items' => [id => {pct, pctOfBase}], 'skippedCount' => N).
	// 'pct' es el % de área del candidato cubierto por la intersección
	// (criterio de ClippingRegionService); 'pctOfBase' es el % de área
	// de $baseWkt cubierto (criterio de la primera pasada de
	// GeographyTupleService, donde la base es el ítem 'actual' y el
	// candidato el ítem 'anterior'). Solo se incluyen los candidatos que
	// se pudieron calcular sin error (no se asume ningún valor por
	// defecto para los que fallan; se cuentan en 'skippedCount').
	public static function Resolve($baseWkt, $candidates)
	{
		if (count($candidates) === 0)
		{
			return array('items' => array(), 'skippedCount' => 0);
		}

		$input = array(
			'cli_geometry' => $baseWkt,
			'candidates' => array(),
		);
		foreach ($candidates as $candidate)
		{
			$input['candidates'][] = array('gei_id' => $candidate['Id'], 'gei_geometry' => $candidate['Wkt']);
		}

		$inputFile = IO::GetTempFilename();
		IO::WriteJson($inputFile, $input);

		$start = hrtime(true);

		$outputLines = Python::Execute('resolve_intersections.py', array($inputFile));

		// run your code...
		$end = hrtime(true);

		IO::Delete($inputFile);

		$output = json_decode(implode('', $outputLines), true);
		if ($output === null || !isset($output['results']))
		{
			throw new PublicException('El script de resolución de intersecciones no devolvió un resultado válido.');
		}

		$items = array();
		foreach ($output['results'] as $result)
		{
			if ($result['pct'] > 0 || $result['pct_of_base'] > 0)
			{
				$items[$result['gei_id']] = array('pct' => $result['pct'], 'pctOfBase' => $result['pct_of_base']);
			}
		}
		$skippedCount = 0;
		if (isset($output['errors']))
		{
			$skippedCount = count($output['errors']);
		}
		$ret = array('items' => $items, 'skippedCount' => $skippedCount);

		// echo ($end - $start) / 1000000000 . " seconds for " . $n . " of " . sizeof($candidates) . "<p>";   // Seconds
		return $ret;
	}
}
