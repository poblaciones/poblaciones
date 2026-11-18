<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\services\mcp\McpIndicatorTable;
use helena\services\mcp\McpToolException;

class McpIndicatorTableTest extends TestCase
{
	private function CreateVariables(): array
	{
		return [
			['id' => 10, 'name' => 'Tasa de mortalidad', 'formula' => 'Defunciones / Nacidos vivos', 'isCategorical' => false,
				'dataCaption' => 'Defunciones', 'normalizationCaption' => 'Nacidos vivos',
				'isNormalized' => true, 'scale' => 1000.0, 'decimals' => 1, 'categories' => []],
			['id' => 20, 'name' => 'Tipo', 'formula' => 'Tipo de área', 'isCategorical' => true,
				'dataCaption' => 'Conteo', 'normalizationCaption' => '',
				'isNormalized' => false, 'scale' => null, 'decimals' => 0,
				'categories' => [['id' => 1, 'name' => 'Urbano'], ['id' => 2, 'name' => 'Rural']]]
		];
	}

	private function CreateItems(): array
	{
		return [
			['GeographyItemId' => 1, 'VID' => 10, 'LID' => null, 'Value' => 5, 'Total' => 1000],
			['GeographyItemId' => 2, 'VID' => 10, 'LID' => null, 'Value' => 3, 'Total' => 700],
			['GeographyItemId' => 1, 'VID' => 20, 'LID' => 1, 'Value' => 4, 'Total' => 4],
			['GeographyItemId' => 1, 'VID' => 20, 'LID' => 2, 'Value' => 6, 'Total' => 6],
			['GeographyItemId' => 2, 'VID' => 20, 'LID' => 1, 'Value' => 1, 'Total' => 1]
		];
	}

	private function CreateGeographyItems(): array
	{
		return [
			1 => ['Code' => '10', 'Caption' => 'Belén', 'ParentCaption' => 'Catamarca'],
			2 => ['Code' => '20', 'Caption' => 'Ambato', 'ParentCaption' => 'Catamarca']
		];
	}

	private function Build(?string $sortBy = null, string $order = 'asc', int $limit = 100, int $offset = 0, ?array $items = null): array
	{
		if ($items === null)
			$items = $this->CreateItems();
		return McpIndicatorTable::Build($this->CreateVariables(), $items, $this->CreateGeographyItems(), $sortBy, $order, $limit, $offset);
	}

	private function ColumnNames(array $table): array
	{
		return array_column($table['columns'], 'name');
	}

	public function testBuildsColumnsInOrder()
	{
		$table = $this->Build();
		$this->assertSame(['codigo', 'nombre', 'padre', 'tasa_de_mortalidad', 'tasa_de_mortalidad_cantidad', 'tasa_de_mortalidad_base_de_calculo', 'tipo_urbano', 'tipo_rural'],
			$this->ColumnNames($table));
	}

	public function testResolvesNormalizedValuesAndCategoryCounts()
	{
		$table = $this->Build();
		$this->assertSame(2, $table['totalRows']);
		$this->assertSame(['20', 'Ambato', 'Catamarca', '4.29', '3', '700', '1', ''], $table['rows'][0]);
		$this->assertSame(['10', 'Belén', 'Catamarca', '5', '5', '1000', '4', '6'], $table['rows'][1]);
	}

	public function testQuantityAndBaseKeepTheirDecimalsAndAreDescribed()
	{
		$items = [['GeographyItemId' => 1, 'VID' => 10, 'LID' => null, 'Value' => 9219, 'Total' => 1.8376]];
		$table = $this->Build(null, 'asc', 100, 0, $items);
		$this->assertSame(['10', 'Belén', 'Catamarca', '5016869.83', '9219', '1.84', '', ''], $table['rows'][0]);
		$this->assertStringContainsString('numerador', $table['columns'][4]['description']);
		$this->assertStringContainsString('Defunciones', $table['columns'][4]['description']);
		$this->assertStringContainsString('Nacidos vivos', $table['columns'][5]['detail']);
	}

	public function testDefaultOrderIsByNameIgnoringAccents()
	{
		$table = $this->Build();
		$this->assertSame(['Ambato', 'Belén'], array_column($table['rows'], 1));
	}

	public function testSortsByNumericVariableDescending()
	{
		$table = $this->Build('10', 'desc');
		$this->assertSame(['Belén', 'Ambato'], array_column($table['rows'], 1));
	}

	public function testSortsByCode()
	{
		$table = $this->Build('code', 'desc');
		$this->assertSame(['20', '10'], array_column($table['rows'], 0));
	}

	public function testAreasWithoutValueGoLastInBothDirections()
	{
		$items = $this->CreateItems();
		$items[] = ['GeographyItemId' => 3, 'VID' => 20, 'LID' => 1, 'Value' => 2, 'Total' => 2];
		$geography = $this->CreateGeographyItems();
		$geography[3] = ['Code' => '30', 'Caption' => 'Antofagasta', 'ParentCaption' => 'Catamarca'];
		$ascending = McpIndicatorTable::Build($this->CreateVariables(), $items, $geography, '10', 'asc', 100, 0);
		$descending = McpIndicatorTable::Build($this->CreateVariables(), $items, $geography, '10', 'desc', 100, 0);
		$this->assertSame('Antofagasta', $ascending['rows'][2][1]);
		$this->assertSame('Antofagasta', $descending['rows'][2][1]);
	}

	public function testPaginationKeepsTotalRows()
	{
		$table = $this->Build('name', 'asc', 1, 1);
		$this->assertSame(2, $table['totalRows']);
		$this->assertCount(1, $table['rows']);
		$this->assertSame('Belén', $table['rows'][0][1]);
	}

	public function testSortingByCategoricalVariableIsRejected()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('sort_by');
		$this->Build('20');
	}

	public function testUnknownSortByIsRejectedListingOptions()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('10');
		$this->Build('poblacion');
	}

	public function testParentColumnIsOmittedWhenThereIsNoParent()
	{
		$geography = [1 => ['Code' => '1', 'Caption' => 'Catamarca', 'ParentCaption' => null],
			2 => ['Code' => '2', 'Caption' => 'Tucumán', 'ParentCaption' => null]];
		$table = McpIndicatorTable::Build($this->CreateVariables(), $this->CreateItems(), $geography, null, 'asc', 100, 0);
		$this->assertFalse(in_array('padre', $this->ColumnNames($table), true));
	}

	public function testCategoryWithoutLabelGetsItsOwnColumn()
	{
		$items = $this->CreateItems();
		$items[] = ['GeographyItemId' => 1, 'VID' => 20, 'LID' => null, 'Value' => 2, 'Total' => 2];
		$table = $this->Build(null, 'asc', 100, 0, $items);
		$this->assertTrue(in_array('tipo_sin_categoria', $this->ColumnNames($table), true));
	}

	public function testEmptyItemsProduceNoRows()
	{
		$table = $this->Build(null, 'asc', 100, 0, []);
		$this->assertSame(0, $table['totalRows']);
		$this->assertSame([], $table['rows']);
	}
}
