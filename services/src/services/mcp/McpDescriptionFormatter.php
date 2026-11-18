<?php

namespace helena\services\mcp;

/**
 * Texto de las respuestas descriptivas (catálogo, indicador, delimitación, regiones,
 * resumen). Las estructuras de entrada están descriptas en IMcpGateway. No accede a la base.
 */
class McpDescriptionFormatter
{
	public static function FormatCatalog(array $catalog): string
	{
		$text = McpToolCatalog::GetGuide() . "\n\n";
		$text .= "## Indicadores públicos\n";
		$text .= 'Cada línea: id|nombre|series (id de la cartografía de origen)|niveles. '
			. 'Metadatos (PDF) de una cartografía: ' . $catalog['metadataUrlTemplate'] . "\n";
		foreach ($catalog['indicatorGroups'] as $group)
		{
			$text .= "\n### " . $group['name'] . "\n";
			foreach ($group['providers'] as $provider)
			{
				$text .= self::FormatProvider($provider);
			}
		}
		$text .= "\n## Delimitaciones\n";
		$text .= "Las que traen sus ítems están completas: esos ids sirven directamente como region_ids.\n";
		foreach ($catalog['boundaryGroups'] as $group)
		{
			$text .= "\n### " . $group['name'] . "\n";
			foreach ($group['boundaries'] as $boundary)
			{
				$text .= self::FormatCatalogBoundary($boundary);
			}
		}
		return $text;
	}

	private static function FormatProvider(array $provider): string
	{
		$text = '';
		if ($provider['name'] !== null && $provider['name'] !== '')
			$text .= '#### ' . $provider['name'] . "\n";
		foreach ($provider['indicators'] as $indicator)
		{
			$text .= $indicator['id'] . '|' . $indicator['name'] . '|' . self::FormatSeries($indicator['versions'])
				. '|' . self::FormatLevelNames($indicator['versions']) . "\n";
		}
		return $text;
	}

	private static function FormatSeries(array $versions): string
	{
		$items = [];
		foreach ($versions as $version)
		{
			$items[] = $version['name'] . ' (cart. ' . $version['workId'] . ')';
		}
		return implode(', ', $items);
	}

	private static function FormatLevelNames(array $versions): string
	{
		$names = [];
		foreach ($versions as $version)
		{
			foreach ($version['levels'] as $level)
			{
				if (!in_array($level['name'], $names, true))
					$names[] = $level['name'];
			}
		}
		return implode(', ', $names);
	}

	private static function FormatCatalogBoundary(array $boundary): string
	{
		$text = '#### ' . $boundary['name'] . ' (delimitación ' . $boundary['id'] . ') · ' . $boundary['itemCount'] . " ítems\n";
		if ($boundary['metadataUrl'] !== null)
			$text .= 'Metadatos (PDF): ' . $boundary['metadataUrl'] . "\n";
		if ($boundary['items'] === null)
			return $text . "Ítems no incluidos por su cantidad: usar find_regions o list_boundary_items.\n";
		return $text . "id|código|nombre\n" . self::FormatItemLines($boundary['items']);
	}

	/**
	 * Una línea id|código|nombre por ítem, con un encabezado por cada ítem superior
	 * (por ejemplo, la provincia de cada departamento).
	 */
	public static function FormatItemLines(array $items): string
	{
		$text = '';
		$currentParent = null;
		foreach ($items as $item)
		{
			if ($item['parentId'] !== null && $item['parentId'] !== $currentParent)
			{
				$text .= '> ' . $item['parentName'] . ' (id ' . $item['parentId'] . ")\n";
				$currentParent = $item['parentId'];
			}
			$text .= $item['id'] . '|' . self::NullToEmpty($item['code']) . '|' . $item['name'] . "\n";
		}
		return $text;
	}

	private static function NullToEmpty($value): string
	{
		if ($value === null)
			return '';
		return strval($value);
	}

	public static function FormatIndicator(array $indicator): string
	{
		$text = '# ' . $indicator['name'] . ' (indicador ' . $indicator['id'] . ")\n";
		if (count($indicator['versions']) === 0)
			return $text . "Sin series públicas.\n";
		foreach ($indicator['versions'] as $version)
		{
			$text .= "\n## Serie " . $version['name'] . ' (serie ' . $version['id'] . ")\n";
			$text .= 'Cartografía de origen: ' . $version['work'] . "\n";
			$text .= 'Metadatos (PDF): ' . $version['metadataUrl'] . "\nMapa: " . $version['mapUrl'] . "\n";
			foreach ($version['levels'] as $level)
			{
				$text .= self::FormatLevel($level);
			}
		}
		return $text;
	}

	private static function FormatLevel(array $level): string
	{
		$text = "\n### Nivel " . $level['name'] . ' (nivel ' . $level['id'] . ') · ' . self::LevelTypeName($level['type'])
			. ' · ' . $level['datasetName'] . "\n";
		if (!$level['listable'])
			$text .= "Sin listado de filas en este conector (usar get_indicator_summary o el mapa).\n";
		if ($level['partition'] !== null)
			$text .= self::FormatPartition($level['partition']);
		$text .= "Variables:\n";
		foreach ($level['variables'] as $variable)
		{
			$text .= self::FormatVariable($variable);
		}
		return $text;
	}

	private static function LevelTypeName(string $type): string
	{
		if ($type === 'L')
			return 'puntos';
		if ($type === 'S')
			return 'zonas (polígonos propios)';
		return 'áreas de una geografía estándar';
	}

	private static function FormatPartition(array $partition): string
	{
		$items = [];
		foreach ($partition['values'] as $value)
		{
			if ($value['value'] !== '')
				$items[] = $value['value'] . '=' . $value['caption'];
		}
		$text = 'Partición «' . $partition['name'] . '» ';
		if ($partition['mandatory'])
			$text .= '(obligatoria)';
		else
			$text .= '(opcional; sin el parámetro se consulta «' . $partition['allCaption'] . '»)';
		return $text . ', parámetro partition: ' . implode('; ', $items) . "\n";
	}

	private static function FormatVariable(array $variable): string
	{
		$text = '- ' . $variable['id'] . ' · ' . $variable['name'];
		if (!$variable['available'])
			return $text . " · no disponible en este conector (variable de brecha)\n";
		$text .= ' · fórmula: ' . $variable['formula'];
		$text .= ' · unidad: ' . McpValues::UnitLabel($variable['isNormalized'], $variable['scale']);
		if ($variable['isCategorical'] && count($variable['categories']) > 0)
		{
			$names = [];
			foreach ($variable['categories'] as $category)
			{
				$names[] = $category['name'];
			}
			$text .= ' · categorías: ' . implode(', ', $names);
		}
		if ($variable['legend'] !== null && $variable['legend'] !== '')
			$text .= ' · nota: ' . $variable['legend'];
		return $text . "\n";
	}

	public static function FormatBoundary(array $boundary): string
	{
		$text = '# ' . $boundary['name'] . ' (delimitación ' . $boundary['id'] . ') · grupo ' . $boundary['group']
			. ' · ' . $boundary['itemCount'] . " ítems\n";
		foreach ($boundary['versions'] as $version)
		{
			$text .= '- Versión ' . $version['name'] . ' (id ' . $version['id'] . ')';
			if ($version['metadataUrl'] !== null)
				$text .= ' · Metadatos (PDF): ' . $version['metadataUrl'];
			$text .= ' · Mapa: ' . $version['mapUrl'] . "\n";
		}
		return $text . "\nPara listar los ítems: list_boundary_items, o el catálogo si la delimitación vino completa.\n";
	}

	public static function FormatRegions(array $result, string $query): string
	{
		if (count($result['regions']) === 0)
			return 'No se encontraron regiones para «' . $query . '». Probar con otra grafía o con un nombre más corto.';
		$text = 'Regiones que coinciden con «' . $query . "» (el id se usa como region_ids):\n";
		foreach ($result['regions'] as $region)
		{
			$text .= '- id ' . $region['id'] . ' · ' . $region['name'];
			if ($region['location'] !== null && $region['location'] !== '')
				$text .= ' · ' . $region['location'];
			$text .= "\n";
		}
		return $text;
	}

	public static function FormatBoundaryItems(array $result): string
	{
		$total = $result['totalItems'];
		$shown = count($result['items']);
		$text = '# ' . $result['boundary']['name'] . ' (delimitación ' . $result['boundary']['id'] . ")\n";
		if ($shown === 0)
			return $text . 'Ítems: 0 de ' . $total . " · sin resultados\n";
		$first = $result['offset'] + 1;
		$last = $result['offset'] + $shown;
		$text .= 'Ítems ' . $first . '–' . $last . ' de ' . $total;
		if ($last < $total)
			$text .= ' · continúa con offset=' . $last;
		else
			$text .= ' · fin del listado';
		return $text . "\nid|código|nombre\n" . self::FormatItemLines($result['items']);
	}

	public static function FormatSummary(array $summary): string
	{
		$source = $summary['source'];
		$text = '# Resumen: ' . $source['indicator'] . ' · ' . $source['version'] . ' · ' . $summary['level']['name'] . "\n";
		$text .= self::FormatSourceLines($source);
		$text .= 'Regiones: ' . self::FormatRegionList($summary['regions']) . "\n";
		if ($summary['partition'] !== null)
			$text .= 'Partición: ' . $summary['partition']['name'] . ' = ' . $summary['partition']['caption'] . "\n";
		$text .= "\n## Variables\n";
		foreach ($summary['variables'] as $variable)
		{
			$text .= self::FormatSummaryVariable($variable, $summary['level']['type']);
		}
		foreach ($summary['notes'] as $note)
		{
			$text .= "\n" . $note . "\n";
		}
		return $text;
	}

	public static function FormatMapLink(array $result): string
	{
		$source = $result['source'];
		$text = '# Mapa: ' . $source['indicator'] . ' · ' . $source['version'] . ' · ' . $result['level']['name'] . "\n";
		$text .= self::FormatSourceLines($source);
		$text .= 'Regiones: ' . self::FormatRegionList($result['regions']) . "\n";
		if ($result['partition'] !== null)
			$text .= 'Partición: ' . $result['partition']['name'] . ' = ' . $result['partition']['caption'] . "\n";
		$text .= "\nEntregar el enlace «Mapa» al usuario: abre el visor de Poblaciones con la misma serie, nivel y regiones.\n";
		return $text;
	}

	public static function FormatDataResult(array $result, int $maxChars): string
	{
		$source = $result['source'];
		$headerLines = explode("\n", rtrim(self::FormatSourceLines($source)));
		$headerLines[] = 'Regiones: ' . self::FormatRegionList($result['regions']);
		if ($result['partition'] !== null)
			$headerLines[] = 'Partición: ' . $result['partition']['name'] . ' = ' . $result['partition']['caption'];
		$document = [
			'title' => $source['indicator'] . ' · ' . $source['version'] . ' · ' . $result['level']['name'],
			'headerLines' => $headerLines,
			'columns' => $result['columns'],
			'rows' => $result['rows'],
			'totalRows' => $result['totalRows'],
			'offset' => $result['offset'],
			'dictionaryOnly' => $result['dictionaryOnly'],
			'notes' => $result['notes']
		];
		return McpTextFormatter::FormatTable($document, $maxChars);
	}

	public static function FormatSourceLines(array $source): string
	{
		return 'Fuente: cartografía «' . $source['work'] . '» · Metadatos (PDF): '
			. $source['metadataUrl'] . "\nMapa: " . $source['mapUrl'] . "\n";
	}

	public static function FormatRegionList(array $regions): string
	{
		if (count($regions) === 0)
			return 'todo el nivel';
		$items = [];
		foreach ($regions as $region)
		{
			$items[] = $region['name'];
		}
		return implode(', ', $items);
	}

	private static function FormatSummaryVariable(array $variable, string $levelType): string
	{
		$elements = McpValues::ElementsLabel($levelType);
		$text = "\n### " . $variable['name'] . "\n";
		$text .= 'Fórmula: ' . $variable['formula'] . ' · Unidad: ' . $variable['unit'] . "\n";
		if ($variable['kind'] === 'categorical')
			return $text . self::FormatCategoryTable($variable['categories'], $elements);
		$decimals = McpValues::EffectiveDecimals($variable['decimals'], $variable['isNormalized']);
		if ($variable['isNormalized'])
			$text .= self::FormatNormalizedAmounts($variable, $decimals);
		else
			$text .= 'Cantidad: ' . self::ValueOrNone(McpValues::FormatAmount($variable['value'], $decimals)) . "\n";
		return $text . self::FormatCoverage($variable, $elements);
	}

	/**
	 * Resultado junto a la cantidad (numerador) y la base de cálculo (denominador) con que se obtuvo,
	 * para que el asistente informe a cuántos corresponde el valor y sobre qué total.
	 */
	private static function FormatNormalizedAmounts(array $variable, int $decimals): string
	{
		$quantityName = McpValues::TermLabel($variable['dataCaption'], $variable['name']);
		$baseName = McpValues::TermLabel($variable['normalizationCaption'], 'base de cálculo');
		$text = 'Resultado: ' . self::ValueOrNone(McpValues::FormatNumber($variable['value'], $decimals)) . "\n";
		$text .= 'Cantidad (numerador, ' . $quantityName . '): ' . self::ValueOrNone(McpValues::FormatAmount($variable['quantity'], $decimals)) . "\n";
		$text .= 'Base de cálculo (denominador, ' . $baseName . '): ' . self::ValueOrNone(McpValues::FormatAmount($variable['total'], $decimals)) . "\n";
		return $text;
	}

	private static function FormatCoverage(array $variable, string $elements): string
	{
		$text = $elements . ': ' . $variable['areas'];
		if ($variable['km2'] > 0)
			$text .= ' · Superficie: ' . McpValues::FormatNumber($variable['km2'], 2) . ' km2';
		return $text . "\n";
	}

	private static function ValueOrNone(string $formatted): string
	{
		if ($formatted === '')
			return 'sin dato';
		return $formatted;
	}

	private static function FormatCategoryTable(array $categories, string $elements): string
	{
		$text = '| categoría | recuento | ' . mb_strtolower($elements) . " | km2 | participación |\n| --- | --- | --- | --- | --- |\n";
		$sumCount = 0.0;
		foreach ($categories as $category)
		{
			$share = '';
			if ($category['share'] !== null)
				$share = McpValues::FormatNumber($category['share'] * 100, 1) . ' %';
			$text .= '| ' . $category['name'] . ' | ' . McpValues::FormatNumber($category['count'], 0) . ' | ' . $category['areas']
				. ' | ' . McpValues::FormatNumber($category['km2'], 2) . ' | ' . $share . " |\n";
			$sumCount += floatval($category['count']);
		}
		return $text . 'Total de las categorías: ' . McpValues::FormatNumber($sumCount, 0) . "\n";
	}
}
