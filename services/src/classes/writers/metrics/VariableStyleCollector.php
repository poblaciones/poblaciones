<?php

namespace helena\classes\writers\metrics;

use minga\framework\Log;

/**
 * Recorre los indicadores/variables asociados a un dataset y arma, para cada uno, el renderer-v2
 * de QGIS correspondiente. Es el núcleo común entre el embebido en GeoPackage (tabla layer_styles)
 * y el proyecto QGIS (.qgz) que acompaña al export de Shapefile.
 *
 * Un error al resolver una variable puntual no debe impedir la descarga del archivo de datos:
 * se descarta esa variable (o, ante un problema estructural, se descarta el embebido completo)
 * y se registra en el log.
 */
class VariableStyleCollector
{
	/**
	 * @return array{styles: array<int, array{styleName: string, rendererXml: string, description: string, isDefault: bool}>,
	 *               bbox: array{minX: float, minY: float, maxX: float, maxY: float}|null}
	 */
	public static function Collect(int $datasetId, bool $fromDraft, array $cols, string $geometryKind): array
	{
		$styles = array();
		$bbox = null;
		try
		{
			$repository = new VariableSymbologyRepository($fromDraft);
			$levels = $repository->GetMetricVersionLevels($datasetId);
			if (count($levels) === 0)
				return array('styles' => $styles, 'bbox' => $bbox);

			$columnMap = self::BuildColumnMap($cols);

			foreach ($levels as $level)
			{
				$bbox = self::MergeBbox($bbox, self::ParseBboxWkt($level['mvl_extents_wkt'] ?? null));

				$variables = $repository->GetVariables((int)$level['mvl_id']);
				foreach ($variables as $variable)
				{
					try
					{
						$style = self::BuildVariableStyle($repository, $level, $variable, $columnMap, $geometryKind);
						if ($style !== null)
							$styles[] = $style;
					}
					catch (\Exception $e)
					{
						Log::LogException($e, true);
					}
				}
			}
		}
		catch (\Exception $e)
		{
			Log::LogException($e, true);
		}

		// QGIS lista los estilos alfabéticamente en el desplegable; si el default no es el primero
		// en ese orden, lo que se ve seleccionado al abrir no coincide con lo que dice el combo.
		usort($styles, fn($a, $b) => strcasecmp($a['styleName'], $b['styleName']));
		foreach ($styles as $i => $style)
			$styles[$i]['isDefault'] = ($i === 0);

		return array('styles' => $styles, 'bbox' => $bbox);
	}

	/**
	 * mvl_extents_wkt viene como POLYGON((x1 y1, x2 y2, ...)) (el rectángulo envolvente ya
	 * calculado en la base). Alcanza con extraer todos los números como pares x,y consecutivos.
	 */
	private static function ParseBboxWkt(?string $wkt): ?array
	{
		if ($wkt === null || $wkt === '')
			return null;

		preg_match_all('/-?\d+(?:\.\d+)?/', $wkt, $nums);
		$count = count($nums[0]);
		if ($count < 2)
			return null;

		$bbox = null;
		for ($i = 0; $i + 1 < $count; $i += 2)
			$bbox = self::MergeBbox($bbox, array(
				'minX' => (float)$nums[0][$i], 'minY' => (float)$nums[0][$i + 1],
				'maxX' => (float)$nums[0][$i], 'maxY' => (float)$nums[0][$i + 1],
			));
		return $bbox;
	}

	private static function MergeBbox(?array $a, ?array $b): ?array
	{
		if ($a === null)
			return $b;
		if ($b === null)
			return $a;
		return array(
			'minX' => min($a['minX'], $b['minX']),
			'minY' => min($a['minY'], $b['minY']),
			'maxX' => max($a['maxX'], $b['maxX']),
			'maxY' => max($a['maxY'], $b['maxY']),
		);
	}

	private static function BuildColumnMap(array $cols): array
	{
		$map = array();
		foreach ($cols as $col)
		{
			if (isset($col['variable']) && isset($col['effectiveVariable']))
				$map[$col['variable']] = $col['effectiveVariable'];
		}
		return $map;
	}

	private static function BuildVariableStyle(VariableSymbologyRepository $repository, array $level,
		array $variable, array $columnMap, string $geometryKind): ?array
	{
		$cutMode = $variable['vsy_cut_mode'];
		$valueLabels = $repository->GetValueLabels((int)$variable['mvv_id']);

		if ($cutMode === 'V')
		{
			$cutVariable = $variable['cut_column_variable'];
			if ($cutVariable === null || !isset($columnMap[$cutVariable]))
				return null; // columna de corte fuera del export
			$expr = '"' . $columnMap[$cutVariable] . '"';
			$isText = QmlRendererBuilder::ResolveIsTextComparison($variable['cut_column_format']);
		}
		else if ($cutMode === 'S')
		{
			$expr = null;
			$isText = false;
		}
		else if ($cutMode === 'J' || $cutMode === 'T' || $cutMode === 'M')
		{
			$expr = VariableFormula::Build($variable, $columnMap);
			if ($expr === null)
				return null; // fórmula fuera de alcance o columna no exportada
			$isText = false;
		}
		else
			return null; // CutMode no reconocido

		if ($cutMode !== 'S' && count($valueLabels) === 0)
			return null;

		$rendererXml = QmlRendererBuilder::Build($variable['mvv_caption'], $cutMode, $expr, $isText, $valueLabels, $geometryKind);
		if ($rendererXml === null)
			return null;

		return array(
			'styleName'   => $level['mtr_caption'] . ' - ' . $variable['mvv_caption'],
			'rendererXml' => $rendererXml,
			'description' => $variable['mvv_legend'] !== null ? $variable['mvv_legend'] : '',
			'isDefault'   => false,
		);
	}
}
