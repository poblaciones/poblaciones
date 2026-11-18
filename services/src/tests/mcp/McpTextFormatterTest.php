<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\services\mcp\McpTextFormatter;

class McpTextFormatterTest extends TestCase
{
	private function CreateDocument(array $rows, int $totalRows, int $offset = 0): array
	{
		return [
			'title' => 'Mortalidad infantil · 2022 · Departamentos',
			'headerLines' => ['Fuente: prueba'],
			'columns' => [
				['name' => 'codigo', 'description' => 'Código', 'type' => 'texto', 'detail' => ''],
				['name' => 'nombre', 'description' => 'Nombre | con barra', 'type' => 'texto', 'detail' => '']],
			'rows' => $rows,
			'totalRows' => $totalRows,
			'offset' => $offset,
			'dictionaryOnly' => false,
			'notes' => []
		];
	}

	public function testSlugRemovesAccentsAndSymbols()
	{
		$this->assertSame('tasa_de_mortalidad_por_mil', McpTextFormatter::Slug('Tasa de mortalidad (por mil)'));
		$this->assertSame('ninos_menores_de_5_anos', McpTextFormatter::Slug('Niños menores de 5 años'));
		$this->assertSame('columna', McpTextFormatter::Slug('---'));
	}

	public function testBuildColumnNamesAddsIdOnlyOnCollision()
	{
		$names = McpTextFormatter::BuildColumnNames([
			['caption' => 'Total', 'id' => 5],
			['caption' => 'total', 'id' => 7],
			['caption' => 'Otro', 'id' => 9]
		]);
		$this->assertSame(['total_5', 'total_7', 'otro'], $names);
	}

	public function testBuildColumnNamesWithoutIdsStillAreUnique()
	{
		$names = McpTextFormatter::BuildColumnNames([['caption' => 'Dato', 'id' => null], ['caption' => 'Dato', 'id' => null]]);
		$this->assertSame(['dato', 'dato_2'], $names);
	}

	public function testCsvFieldEscaping()
	{
		$this->assertSame('simple', McpTextFormatter::CsvField('simple'));
		$this->assertSame('"con, coma"', McpTextFormatter::CsvField('con, coma'));
		$this->assertSame('"dice ""hola"""', McpTextFormatter::CsvField('dice "hola"'));
		$this->assertSame("\"dos\nlíneas\"", McpTextFormatter::CsvField("dos\nlíneas"));
	}

	public function testFormatTableCompleteListing()
	{
		$text = McpTextFormatter::FormatTable($this->CreateDocument([['10007', 'Ambato'], ['10014', 'Ancasti, norte']], 2), 100000);
		$this->assertStringContainsString("# Mortalidad infantil · 2022 · Departamentos\nFuente: prueba\n", $text);
		$this->assertStringContainsString('Filas 1–2 de 2 · fin del listado', $text);
		$this->assertStringContainsString('| codigo | Código | texto |  |', $text);
		$this->assertStringContainsString('Nombre / con barra', $text);
		$this->assertStringContainsString("## Datos (CSV)\ncodigo,nombre\n10007,Ambato\n10014,\"Ancasti, norte\"\n", $text);
	}

	public function testDictionaryPrecedesData()
	{
		$text = McpTextFormatter::FormatTable($this->CreateDocument([['1', 'a']], 1), 100000);
		$this->assertLessThan(strpos($text, '## Datos (CSV)'), strpos($text, '## Diccionario'));
	}

	public function testFormatTableCutsRowsByCharacterBudget()
	{
		$rows = [];
		for ($n = 0; $n < 200; $n++)
		{
			$rows[] = [str_pad(strval($n), 5, '0', STR_PAD_LEFT), 'Departamento número ' . $n];
		}
		$text = McpTextFormatter::FormatTable($this->CreateDocument($rows, 531), 1500);
		$this->assertLessThanOrEqual(1500, mb_strlen($text, 'UTF-8'));
		$this->assertMatchesRegularExpression('/Filas 1–(\d+) de 531 · continúa con offset=(\d+)/', $text);
		preg_match('/Filas 1–(\d+) de 531 · continúa con offset=(\d+)/', $text, $found);
		$this->assertSame($found[1], $found[2]);
		$this->assertSame(intval($found[1]), substr_count($text, 'Departamento número '));
	}

	public function testFormatTableStatusUsesOffset()
	{
		$text = McpTextFormatter::FormatTable($this->CreateDocument([['1', 'a'], ['2', 'b'], ['3', 'c']], 531, 200), 100000);
		$this->assertStringContainsString('Filas 201–203 de 531 · continúa con offset=203', $text);
	}

	public function testFormatTableLastPageSaysEnd()
	{
		$text = McpTextFormatter::FormatTable($this->CreateDocument([['1', 'a']], 201, 200), 100000);
		$this->assertStringContainsString('Filas 201–201 de 201 · fin del listado', $text);
	}

	public function testFormatTableWithoutRows()
	{
		$text = McpTextFormatter::FormatTable($this->CreateDocument([], 0), 100000);
		$this->assertStringContainsString('Filas: 0 · sin resultados', $text);
	}

	public function testFormatTableWhenNoRowFits()
	{
		$text = McpTextFormatter::FormatTable($this->CreateDocument([['1', str_repeat('x', 5000)]], 1), 900);
		$this->assertStringContainsString('no cabe ninguna', $text);
	}

	public function testDictionaryOnlyOmitsData()
	{
		$document = $this->CreateDocument([], 0);
		$document['dictionaryOnly'] = true;
		$document['notes'] = ['Elegir columnas con el parámetro columns.'];
		$text = McpTextFormatter::FormatTable($document, 100000);
		$this->assertStringNotContainsString('## Datos (CSV)', $text);
		$this->assertStringContainsString('## Diccionario', $text);
		$this->assertStringContainsString('Elegir columnas', $text);
	}
}
