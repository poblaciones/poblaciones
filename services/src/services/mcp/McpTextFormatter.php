<?php

namespace helena\services\mcp;

/**
 * Arma el texto de las respuestas con datos: encabezado, diccionario y CSV en un único
 * bloque. No accede a la base.
 */
class McpTextFormatter
{
	const STATUS_RESERVE_CHARS = 160;

	const MAX_COLUMN_NAME_LENGTH = 60;

	const ACCENTS = [
		'á' => 'a', 'à' => 'a', 'â' => 'a', 'ä' => 'a', 'ã' => 'a',
		'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
		'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
		'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'ö' => 'o', 'õ' => 'o',
		'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
		'ñ' => 'n', 'ç' => 'c'
	];

	public static function Slug(string $text): string
	{
		$slug = strtr(mb_strtolower($text, 'UTF-8'), self::ACCENTS);
		$slug = preg_replace('/[^a-z0-9]+/', '_', $slug);
		$slug = trim($slug, '_');
		$slug = trim(substr($slug, 0, self::MAX_COLUMN_NAME_LENGTH), '_');
		if ($slug === '')
			return 'columna';
		return $slug;
	}

	/**
	 * Nombres de columna estables y únicos. Ante una colisión se agrega el id como sufijo
	 * a todas las columnas que coinciden.
	 *
	 * @param array $items Lista de ['caption' => texto, 'id' => id o null].
	 */
	public static function BuildColumnNames(array $items): array
	{
		$slugs = [];
		foreach ($items as $item)
		{
			$slugs[] = self::Slug($item['caption']);
		}
		$occurrences = array_count_values($slugs);
		$names = [];
		foreach ($items as $index => $item)
		{
			$name = $slugs[$index];
			if ($occurrences[$name] > 1 && $item['id'] !== null)
				$name = $name . '_' . $item['id'];
			$names[] = self::MakeUnique($name, $names);
		}
		return $names;
	}

	private static function MakeUnique(string $name, array $taken): string
	{
		if (!in_array($name, $taken, true))
			return $name;
		$number = 2;
		while (in_array($name . '_' . $number, $taken, true))
		{
			$number++;
		}
		return $name . '_' . $number;
	}

	public static function CsvField(string $value): string
	{
		$needsQuotes = strpbrk($value, ",\"\r\n") !== false;
		if (!$needsQuotes)
			return $value;
		return '"' . str_replace('"', '""', $value) . '"';
	}

	public static function CsvLine(array $cells): string
	{
		$fields = [];
		foreach ($cells as $cell)
		{
			$fields[] = self::CsvField(strval($cell));
		}
		return implode(',', $fields);
	}

	/**
	 * @param array $document title, headerLines[], columns[] (name, description, type, detail),
	 *   rows[][], totalRows, offset, dictionaryOnly, notes[].
	 */
	public static function FormatTable(array $document, int $maxChars): string
	{
		$head = '# ' . $document['title'] . "\n" . implode("\n", $document['headerLines']) . "\n";
		$dictionary = self::FormatDictionary($document['columns']);
		$tail = self::FormatNotes($document['notes']);
		if ($document['dictionaryOnly'])
			return $head . "\n" . $dictionary . $tail;

		$names = [];
		foreach ($document['columns'] as $column)
		{
			$names[] = $column['name'];
		}
		$csvHeader = "## Datos (CSV)\n" . self::CsvLine($names) . "\n";
		$used = mb_strlen($head . $dictionary . $csvHeader . $tail, 'UTF-8') + self::STATUS_RESERVE_CHARS;
		$included = self::CountRowsThatFit($document['rows'], $maxChars - $used);
		$csv = self::FormatRows($document['rows'], $included);
		$status = self::FormatStatus($document['totalRows'], $document['offset'], $included, count($document['rows']));

		return $head . $status . "\n\n" . $dictionary . "\n" . $csvHeader . $csv . $tail;
	}

	private static function FormatNotes(array $notes): string
	{
		if (count($notes) === 0)
			return '';
		return "\n" . implode("\n", $notes) . "\n";
	}

	private static function FormatDictionary(array $columns): string
	{
		$text = "## Diccionario\n| columna | descripción | tipo | detalle |\n| --- | --- | --- | --- |\n";
		foreach ($columns as $column)
		{
			$text .= '| ' . self::DictionaryCell($column['name']) . ' | ' . self::DictionaryCell($column['description'])
				. ' | ' . self::DictionaryCell($column['type']) . ' | ' . self::DictionaryCell($column['detail']) . " |\n";
		}
		return $text;
	}

	private static function DictionaryCell(string $text): string
	{
		$clean = str_replace(["\r\n", "\n", "\r", '|'], [' ', ' ', ' ', '/'], $text);
		return trim($clean);
	}

	private static function CountRowsThatFit(array $rows, int $budget): int
	{
		$included = 0;
		$spent = 0;
		$fits = true;
		while ($fits && $included < count($rows))
		{
			$spent += mb_strlen(self::CsvLine($rows[$included]), 'UTF-8') + 1;
			if ($spent > $budget)
				$fits = false;
			else
				$included++;
		}
		return $included;
	}

	private static function FormatRows(array $rows, int $included): string
	{
		$csv = '';
		for ($n = 0; $n < $included; $n++)
		{
			$csv .= self::CsvLine($rows[$n]) . "\n";
		}
		return $csv;
	}

	private static function FormatStatus(int $totalRows, int $offset, int $included, int $available): string
	{
		if ($totalRows === 0)
			return 'Filas: 0 · sin resultados';
		if ($included === 0 && $available > 0)
			return 'Filas: ' . $totalRows . ' · no cabe ninguna en el límite de respuesta; reducir las columnas con el parámetro columns';
		$first = $offset + 1;
		$last = $offset + $included;
		if ($last >= $totalRows)
			return 'Filas ' . $first . '–' . $last . ' de ' . $totalRows . ' · fin del listado';
		return 'Filas ' . $first . '–' . $last . ' de ' . $totalRows . ' · continúa con offset=' . $last;
	}
}
