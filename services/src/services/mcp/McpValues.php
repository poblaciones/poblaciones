<?php

namespace helena\services\mcp;

/**
 * Cálculo de los valores que el asistente recibe ya resueltos. No accede a la base.
 *
 * Por área y variable se guardan Value (término de datos) y Total (término de normalización).
 * Si la variable está normalizada, el valor final es Value × escala / Total; si no, es Value.
 */
class McpValues
{
	const MIN_DECIMALS_NORMALIZED = 2;

	public static function ResolveRatio($value, $total, $scale): ?float
	{
		if ($value === null || $total === null)
			return null;
		$totalNumber = floatval($total);
		if ($totalNumber == 0.0)
			return null;
		$scaleNumber = 1.0;
		if ($scale !== null && floatval($scale) != 0.0)
			$scaleNumber = floatval($scale);
		return floatval($value) * $scaleNumber / $totalNumber;
	}

	/**
	 * Resume una variable numérica. Los grupos del resumen son rangos de clasificación del
	 * mapa: se suman todos y el cociente se resuelve una sola vez.
	 *
	 * Devuelve value (resultado), quantity (cantidad del numerador), total (base de cálculo del
	 * denominador, solo en las normalizadas), areas y km2. En las no normalizadas quantity y value coinciden.
	 *
	 * @param array $rows Filas de resumen de la variable: Value, Total, Count, Km2.
	 */
	public static function SummarizeNumeric(array $rows, bool $isNormalized, $scale): array
	{
		$sumValue = 0.0;
		$sumTotal = 0.0;
		$hasTotal = false;
		$areas = 0;
		$km2 = 0.0;
		foreach ($rows as $row)
		{
			$sumValue += floatval($row['Value']);
			if (isset($row['Total']))
			{
				$sumTotal += floatval($row['Total']);
				$hasTotal = true;
			}
			$areas += intval($row['Count']);
			$km2 += floatval($row['Km2']);
		}
		$summary = ['value' => null, 'quantity' => null, 'total' => null, 'areas' => $areas, 'km2' => round($km2, 3)];
		if (count($rows) === 0)
			return $summary;
		$summary['quantity'] = $sumValue;
		if ($isNormalized)
		{
			if ($hasTotal)
				$summary['total'] = $sumTotal;
			$summary['value'] = self::ResolveRatio($sumValue, $summary['total'], $scale);
		}
		else
		{
			$summary['value'] = $sumValue;
		}
		return $summary;
	}

	/**
	 * Resume una variable categórica: recuento, áreas, superficie y participación por categoría.
	 *
	 * @param array $rows Filas de resumen de la variable: Value, Count, Km2, ValueId.
	 * @param array $names Nombres de categoría por id, en el orden de presentación.
	 */
	public static function SummarizeCategories(array $rows, array $names): array
	{
		$byId = [];
		$sumCount = 0.0;
		foreach ($rows as $row)
		{
			$key = self::CategoryKey($row['ValueId']);
			if (!isset($byId[$key]))
				$byId[$key] = ['count' => 0.0, 'areas' => 0, 'km2' => 0.0];
			$byId[$key]['count'] += floatval($row['Value']);
			$byId[$key]['areas'] += intval($row['Count']);
			$byId[$key]['km2'] += floatval($row['Km2']);
			$sumCount += floatval($row['Value']);
		}
		$summary = [];
		foreach (self::OrderCategoryKeys(array_keys($byId), $names) as $key)
		{
			$item = $byId[$key];
			$share = null;
			if ($sumCount != 0.0)
				$share = $item['count'] / $sumCount;
			$summary[] = ['name' => self::CategoryName($key, $names), 'count' => $item['count'],
				'areas' => $item['areas'], 'km2' => round($item['km2'], 3), 'share' => $share];
		}
		return $summary;
	}

	private static function CategoryKey($valueId): string
	{
		if ($valueId === null)
			return 'none';
		return 'id' . intval($valueId);
	}

	private static function CategoryName(string $key, array $names): string
	{
		if ($key === 'none')
			return 'Sin categoría';
		$id = intval(substr($key, 2));
		if (array_key_exists($id, $names))
			return $names[$id];
		return 'Categoría ' . $id;
	}

	private static function OrderCategoryKeys(array $keys, array $names): array
	{
		$ordered = [];
		foreach (array_keys($names) as $id)
		{
			if (in_array('id' . $id, $keys, true))
				$ordered[] = 'id' . $id;
		}
		foreach ($keys as $key)
		{
			if (!in_array($key, $ordered, true))
				$ordered[] = $key;
		}
		return $ordered;
	}

	public static function UnitLabel(bool $isNormalized, $scale): string
	{
		if (!$isNormalized)
			return 'cantidad';
		$scaleNumber = 1.0;
		if ($scale !== null)
			$scaleNumber = floatval($scale);
		if ($scaleNumber == 1.0)
			return 'razón';
		if ($scaleNumber == 100.0)
			return 'porcentaje';
		if ($scaleNumber == 1000.0)
			return 'cada mil';
		if ($scaleNumber == 10000.0)
			return 'cada diez mil';
		if ($scaleNumber == 100000.0)
			return 'cada cien mil';
		if ($scaleNumber == 1000000.0)
			return 'cada millón';
		return 'por cada ' . self::FormatNumber($scaleNumber, 0);
	}

	/**
	 * Un cociente declarado con pocos decimales perdería precisión útil para el asistente
	 * (una tasa de 8,2 se vería como 8), de modo que se piden al menos dos.
	 */
	public static function EffectiveDecimals(int $decimals, bool $isNormalized): int
	{
		if ($isNormalized && $decimals < self::MIN_DECIMALS_NORMALIZED)
			return self::MIN_DECIMALS_NORMALIZED;
		return $decimals;
	}

	/**
	 * Cantidades y bases de cálculo: nunca se redondean a enteros, porque una base como el área
	 * en km² (1,84) perdería su sentido.
	 */
	public static function FormatAmount($value, int $decimals): string
	{
		return self::FormatNumber($value, max($decimals, self::MIN_DECIMALS_NORMALIZED));
	}

	/**
	 * Nombre de lo que cuentan los resultados del resumen según el tipo de nivel (D, L o S).
	 */
	public static function ElementsLabel(string $levelType): string
	{
		if ($levelType === 'L')
			return 'Puntos';
		if ($levelType === 'S')
			return 'Zonas';
		return 'Áreas';
	}

	/**
	 * Nombre de un término de la fórmula; si el indicador fue cacheado antes de guardar
	 * los nombres, se usa el texto de respaldo.
	 */
	public static function TermLabel(?string $caption, string $fallback): string
	{
		if ($caption === null || $caption === '')
			return $fallback;
		return $caption;
	}

	public static function FormatNumber($value, int $decimals): string
	{
		if ($value === null || $value === '')
			return '';
		$number = floatval($value);
		if (is_nan($number) || is_infinite($number))
			return '';
		$text = number_format(round($number, $decimals), $decimals, '.', '');
		if ($decimals > 0)
			$text = rtrim(rtrim($text, '0'), '.');
		if ($text === '-0')
			return '0';
		return $text;
	}
}
