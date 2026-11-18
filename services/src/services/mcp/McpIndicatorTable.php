<?php

namespace helena\services\mcp;

/**
 * Arma la tabla de un indicador por área (por ejemplo, por departamento) a partir de las filas que
 * devuelve TableService. No accede a la base.
 *
 * Las filas de origen son una por área, variable y categoría: GeographyItemId, VID, LID, Value, Total.
 * Los valores se entregan ya resueltos (cociente aplicado), de modo que el asistente no recalcula fórmulas,
 * y cada variable normalizada conserva su cantidad (numerador) y su base de cálculo (denominador).
 */
class McpIndicatorTable
{
	const NO_CATEGORY_KEY = 'none';

	/**
	 * @param array $variables Variables disponibles del nivel (estructura de McpCatalogService::DescribeVariable).
	 * @param array $items Filas de TableService: GeographyItemId, VID, LID, Value, Total.
	 * @param array $geographyItems Datos de cada área por id: Code, Caption, ParentCaption.
	 * @return array columns[] { name, description, type, detail }, rows[][], totalRows
	 */
	public static function Build(array $variables, array $items, array $geographyItems, ?string $sortBy, string $order, int $limit, int $offset): array
	{
		self::CheckSortBy($sortBy, $variables);
		$areas = self::GroupByArea($items, $variables);
		$records = self::BuildRecords($areas, $variables, $geographyItems);
		$sorted = self::SortRecords($records, $sortBy, $order);
		$specs = self::BuildColumnSpecs($variables, $areas, self::HasParent($records));

		$names = McpTextFormatter::BuildColumnNames($specs);
		$columns = [];
		foreach ($specs as $index => $spec)
		{
			$columns[] = ['name' => $names[$index], 'description' => $spec['description'], 'type' => $spec['type'], 'detail' => $spec['detail']];
		}
		$rows = [];
		foreach (array_slice($sorted, $offset, $limit) as $record)
		{
			$rows[] = self::BuildRow($record, $specs, $variables);
		}
		return ['columns' => $columns, 'rows' => $rows, 'totalRows' => count($sorted)];
	}

	private static function CheckSortBy(?string $sortBy, array $variables): void
	{
		if ($sortBy === null || $sortBy === 'name' || $sortBy === 'code')
			return;
		$numericIds = [];
		foreach ($variables as $variable)
		{
			if (!$variable['isCategorical'])
				$numericIds[] = strval($variable['id']);
		}
		if (!in_array($sortBy, $numericIds, true))
			throw new McpToolException("El valor '" . $sortBy . "' no es válido para sort_by. Opciones: name, code o el id de una variable numérica ("
				. implode(', ', $numericIds) . ').');
	}

	private static function GroupByArea(array $items, array $variables): array
	{
		$categoricalIds = [];
		foreach ($variables as $variable)
		{
			if ($variable['isCategorical'])
				$categoricalIds[$variable['id']] = true;
		}
		$areas = [];
		foreach ($items as $item)
		{
			$areaId = intval($item['GeographyItemId']);
			$variableId = intval($item['VID']);
			if (!array_key_exists($areaId, $areas))
				$areas[$areaId] = ['sums' => [], 'categories' => []];
			if (array_key_exists($variableId, $categoricalIds))
				self::AddCategoryCount($areas[$areaId], $variableId, $item);
			else
				self::AddSum($areas[$areaId], $variableId, $item);
		}
		return $areas;
	}

	private static function AddCategoryCount(array &$area, int $variableId, array $item): void
	{
		$key = self::NO_CATEGORY_KEY;
		if ($item['LID'] !== null)
			$key = strval(intval($item['LID']));
		if (!isset($area['categories'][$variableId][$key]))
			$area['categories'][$variableId][$key] = 0.0;
		$area['categories'][$variableId][$key] += floatval($item['Value']);
	}

	private static function AddSum(array &$area, int $variableId, array $item): void
	{
		if (!isset($area['sums'][$variableId]))
			$area['sums'][$variableId] = ['value' => 0.0, 'total' => 0.0, 'hasTotal' => false];
		$area['sums'][$variableId]['value'] += floatval($item['Value']);
		if (isset($item['Total']))
		{
			$area['sums'][$variableId]['total'] += floatval($item['Total']);
			$area['sums'][$variableId]['hasTotal'] = true;
		}
	}

	private static function BuildRecords(array $areas, array $variables, array $geographyItems): array
	{
		$records = [];
		foreach ($areas as $areaId => $area)
		{
			$geography = ['Code' => null, 'Caption' => '', 'ParentCaption' => null];
			if (array_key_exists($areaId, $geographyItems))
				$geography = $geographyItems[$areaId];
			$records[] = [
				'code' => $geography['Code'],
				'name' => strval($geography['Caption']),
				'parent' => $geography['ParentCaption'],
				'numbers' => self::ResolveNumbers($area, $variables),
				'quantities' => self::ResolveQuantities($area, $variables),
				'totals' => self::ResolveTotals($area),
				'counts' => $area['categories']
			];
		}
		return $records;
	}

	private static function ResolveNumbers(array $area, array $variables): array
	{
		$numbers = [];
		foreach ($variables as $variable)
		{
			if (!$variable['isCategorical'])
				$numbers[$variable['id']] = self::ResolveNumber($area, $variable);
		}
		return $numbers;
	}

	private static function ResolveNumber(array $area, array $variable): ?float
	{
		if (!isset($area['sums'][$variable['id']]))
			return null;
		$sum = $area['sums'][$variable['id']];
		if (!$variable['isNormalized'])
			return $sum['value'];
		if (!$sum['hasTotal'])
			return null;
		return McpValues::ResolveRatio($sum['value'], $sum['total'], $variable['scale']);
	}

	private static function ResolveQuantities(array $area, array $variables): array
	{
		$quantities = [];
		foreach ($variables as $variable)
		{
			if (!$variable['isCategorical'] && $variable['isNormalized'] && isset($area['sums'][$variable['id']]))
				$quantities[$variable['id']] = $area['sums'][$variable['id']]['value'];
		}
		return $quantities;
	}

	private static function ResolveTotals(array $area): array
	{
		$totals = [];
		foreach ($area['sums'] as $variableId => $sum)
		{
			if ($sum['hasTotal'])
				$totals[$variableId] = $sum['total'];
		}
		return $totals;
	}

	private static function HasParent(array $records): bool
	{
		foreach ($records as $record)
		{
			if ($record['parent'] !== null && $record['parent'] !== '')
				return true;
		}
		return false;
	}

	private static function SortRecords(array $records, ?string $sortBy, string $order): array
	{
		$direction = 1;
		if ($order === 'desc')
			$direction = -1;
		usort($records, function (array $first, array $second) use ($sortBy, $direction)
		{
			return self::CompareRecords($first, $second, $sortBy, $direction);
		});
		return $records;
	}

	private static function CompareRecords(array $first, array $second, ?string $sortBy, int $direction): int
	{
		if ($sortBy === 'code')
			return $direction * strnatcmp(strval($first['code']), strval($second['code']));
		if ($sortBy !== null && $sortBy !== 'name')
			return self::CompareNumbers($first, $second, intval($sortBy), $direction);
		return $direction * strcmp(McpTextFormatter::Slug($first['name']), McpTextFormatter::Slug($second['name']));
	}

	private static function CompareNumbers(array $first, array $second, int $variableId, int $direction): int
	{
		$firstValue = $first['numbers'][$variableId];
		$secondValue = $second['numbers'][$variableId];
		if ($firstValue === null || $secondValue === null)
			return self::CompareNulls($first, $second, $firstValue, $secondValue);
		if ($firstValue == $secondValue)
			return strcmp(McpTextFormatter::Slug($first['name']), McpTextFormatter::Slug($second['name']));
		if ($firstValue < $secondValue)
			return -1 * $direction;
		return $direction;
	}

	/**
	 * Las áreas sin dato quedan al final, en cualquier sentido de orden.
	 */
	private static function CompareNulls(array $first, array $second, ?float $firstValue, ?float $secondValue): int
	{
		if ($firstValue === null && $secondValue === null)
			return strcmp(McpTextFormatter::Slug($first['name']), McpTextFormatter::Slug($second['name']));
		if ($firstValue === null)
			return 1;
		return -1;
	}

	private static function BuildColumnSpecs(array $variables, array $areas, bool $hasParent): array
	{
		$specs = [
			['kind' => 'code', 'caption' => 'Código', 'id' => null, 'description' => 'Código del área', 'type' => 'texto', 'detail' => ''],
			['kind' => 'name', 'caption' => 'Nombre', 'id' => null, 'description' => 'Nombre del área', 'type' => 'texto', 'detail' => '']
		];
		if ($hasParent)
			$specs[] = ['kind' => 'parent', 'caption' => 'Padre', 'id' => null, 'description' => 'Unidad superior del área', 'type' => 'texto', 'detail' => ''];
		foreach ($variables as $variable)
		{
			if ($variable['isCategorical'])
				$specs = array_merge($specs, self::BuildCategorySpecs($variable, $areas));
			else
				$specs = array_merge($specs, self::BuildNumericSpecs($variable));
		}
		return $specs;
	}

	private static function BuildNumericSpecs(array $variable): array
	{
		$unit = McpValues::UnitLabel($variable['isNormalized'], $variable['scale']);
		$detail = 'Unidad: ' . $unit . ' · Fórmula: ' . $variable['formula'] . ' · variable ' . $variable['id'];
		$specs = [['kind' => 'number', 'variableId' => $variable['id'], 'caption' => $variable['name'], 'id' => $variable['id'],
			'description' => $variable['name'], 'type' => 'número', 'detail' => $detail]];
		if ($variable['isNormalized'])
		{
			$quantityName = McpValues::TermLabel($variable['dataCaption'], $variable['name']);
			$baseName = McpValues::TermLabel($variable['normalizationCaption'], 'base de cálculo');
			$specs[] = ['kind' => 'quantity', 'variableId' => $variable['id'], 'caption' => $variable['name'] . ' (cantidad)', 'id' => $variable['id'],
				'description' => 'Cantidad de ' . $variable['name'] . ' (numerador): ' . $quantityName, 'type' => 'número',
				'detail' => 'Numerador del cociente: ' . $quantityName . ' · variable ' . $variable['id']];
			$specs[] = ['kind' => 'total', 'variableId' => $variable['id'], 'caption' => $variable['name'] . ' (base de cálculo)', 'id' => $variable['id'],
				'description' => 'Base de cálculo de ' . $variable['name'] . ' (denominador): ' . $baseName, 'type' => 'número',
				'detail' => 'Denominador del cociente: ' . $baseName . ' · variable ' . $variable['id']];
		}
		return $specs;
	}

	private static function BuildCategorySpecs(array $variable, array $areas): array
	{
		$specs = [];
		foreach (self::ListCategoryKeys($variable, $areas) as $category)
		{
			$specs[] = ['kind' => 'count', 'variableId' => $variable['id'], 'categoryKey' => $category['key'],
				'caption' => $variable['name'] . ' - ' . $category['name'], 'id' => $variable['id'],
				'description' => $variable['name'] . ': ' . $category['name'], 'type' => 'número',
				'detail' => 'Recuento de la categoría «' . $category['name'] . '» · variable ' . $variable['id']];
		}
		return $specs;
	}

	private static function ListCategoryKeys(array $variable, array $areas): array
	{
		$keys = [];
		foreach ($variable['categories'] as $category)
		{
			$keys[] = ['key' => strval($category['id']), 'name' => $category['name']];
		}
		foreach ($areas as $area)
		{
			if (isset($area['categories'][$variable['id']][self::NO_CATEGORY_KEY]) && !self::ContainsKey($keys, self::NO_CATEGORY_KEY))
				$keys[] = ['key' => self::NO_CATEGORY_KEY, 'name' => 'Sin categoría'];
		}
		return $keys;
	}

	private static function ContainsKey(array $keys, string $key): bool
	{
		foreach ($keys as $item)
		{
			if ($item['key'] === $key)
				return true;
		}
		return false;
	}

	private static function BuildRow(array $record, array $specs, array $variables): array
	{
		$decimalsByVariable = [];
		foreach ($variables as $variable)
		{
			$decimalsByVariable[$variable['id']] = McpValues::EffectiveDecimals($variable['decimals'], $variable['isNormalized']);
		}
		$cells = [];
		foreach ($specs as $spec)
		{
			$cells[] = self::BuildCell($record, $spec, $decimalsByVariable);
		}
		return $cells;
	}

	private static function BuildCell(array $record, array $spec, array $decimalsByVariable): string
	{
		if ($spec['kind'] === 'code')
			return strval($record['code']);
		if ($spec['kind'] === 'name')
			return $record['name'];
		if ($spec['kind'] === 'parent')
			return strval($record['parent']);
		if ($spec['kind'] === 'number')
			return McpValues::FormatNumber($record['numbers'][$spec['variableId']], $decimalsByVariable[$spec['variableId']]);
		if ($spec['kind'] === 'quantity')
		{
			if (!array_key_exists($spec['variableId'], $record['quantities']))
				return '';
			return McpValues::FormatAmount($record['quantities'][$spec['variableId']], $decimalsByVariable[$spec['variableId']]);
		}
		if ($spec['kind'] === 'total')
		{
			if (!array_key_exists($spec['variableId'], $record['totals']))
				return '';
			return McpValues::FormatAmount($record['totals'][$spec['variableId']], $decimalsByVariable[$spec['variableId']]);
		}
		if (!isset($record['counts'][$spec['variableId']][$spec['categoryKey']]))
			return '';
		return McpValues::FormatNumber($record['counts'][$spec['variableId']][$spec['categoryKey']], 0);
	}
}
