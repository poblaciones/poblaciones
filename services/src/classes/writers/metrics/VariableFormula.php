<?php

namespace helena\classes\writers\metrics;

use helena\classes\SpecialColumnEnum;

/**
 * Reconstruye, como expresión de QGIS, el valor normalizado que la plataforma de indicadores
 * calcula en tiempo real (ver services\backoffice\publish\snapshots\Variable::
 * CalculateNormalizedFinalValueField). El GeoPackage exportado sólo contiene las columnas
 * crudas (dato, normalización, brecha) por separado; nunca el valor ya combinado, así que el
 * punto de corte sólo clasifica correctamente si el estilo reproduce la misma fórmula.
 *
 * Fuera de alcance (devuelve null): variables cuya fórmula depende de una columna especial
 * de geografía (población, hogares, área, etc.) o de una dataset_column que no fue incluida
 * en el archivo exportado.
 */
class VariableFormula
{
	/**
	 * @param array $variable  fila de VariableSymbologyRepository::GetVariables
	 * @param array $columnMap dco_variable (nombre técnico) => nombre efectivo de columna en el gpkg
	 */
	public static function Build(array $variable, array $columnMap): ?string
	{
		$value1 = self::NormalizedTerm($variable, '', $columnMap);
		if ($value1 === null)
			return null;

		if (empty($variable['mvv_is_gap']))
			return $value1;

		$value2 = self::NormalizedTerm($variable, '_gap', $columnMap);
		if ($value2 === null)
			return null;

		$isPercentage = ($variable['mvv_normalization'] !== SpecialColumnEnum::NullValue
			&& (int)$variable['mvv_normalization_scale'] === 100);

		if ($isPercentage)
			return "($value2 - $value1)";
		else
			return "(($value2 / $value1 - 1) * 100)";
	}

	// Replica Variable::CalculateNormalizedValueField(): la condición de si corresponde
	// normalizar se decide siempre por el campo principal (mvv_normalization), incluso para
	// el término de la brecha; sólo el campo y la columna en sí llevan el sufijo "_gap".
	private static function NormalizedTerm(array $variable, string $suffix, array $columnMap): ?string
	{
		$dataField = self::ResolveField(
			$variable['mvv' . $suffix . '_data'] ?? null,
			$variable['mvv' . $suffix . '_data_column_variable'] ?? null,
			$columnMap
		);
		if ($dataField === null)
			return null;

		if ($variable['mvv_normalization'] === SpecialColumnEnum::NullValue)
			return $dataField;

		$normField = self::ResolveField(
			$variable['mvv' . $suffix . '_normalization'] ?? null,
			$variable['mvv' . $suffix . '_normalization_column_variable'] ?? null,
			$columnMap
		);
		if ($normField === null)
			return null;

		$scale = (float)$variable['mvv_normalization_scale'];
		return "(CASE WHEN $normField IS NULL THEN NULL ELSE $dataField * $scale / $normField END)";
	}

	// Traduce mvv_data / mvv_normalization (y sus pares _gap) a un campo entre comillas de
	// QGIS. Sólo resuelve columnas propias del dataset (SpecialColumnEnum::Other); cualquier
	// otro caso (sin columna, o columna especial de geografía) queda fuera de alcance.
	private static function ResolveField(?string $specialColumn, ?string $variableName, array $columnMap): ?string
	{
		if ($specialColumn !== SpecialColumnEnum::Other)
			return null;
		if ($variableName === null || !isset($columnMap[$variableName]))
			return null;
		return '"' . $columnMap[$variableName] . '"';
	}
}
