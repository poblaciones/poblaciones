<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\classes\settings\McpSettings;
use helena\services\mcp\McpToolCatalog;
use helena\services\mcp\McpToolException;

class McpToolCatalogTest extends TestCase
{
	private function CreateCatalog(): McpToolCatalog
	{
		return new McpToolCatalog(new McpSettings());
	}

	public function testToolsAreListedInFixedOrder()
	{
		$names = [];
		foreach ($this->CreateCatalog()->GetTools() as $tool)
		{
			$names[] = $tool['name'];
		}
		$this->assertSame(['get_catalog', 'describe_indicator', 'describe_boundary', 'find_regions', 'list_boundary_items',
			'show_map', 'get_indicator_summary', 'get_indicator_data', 'get_dataset_records'], $names);
	}

	public function testEveryToolIsReadOnlyAndHasTitle()
	{
		foreach ($this->CreateCatalog()->GetTools() as $tool)
		{
			$this->assertTrue($tool['annotations']['readOnlyHint']);
			$this->assertFalse($tool['annotations']['destructiveHint']);
			$this->assertNotSame('', $tool['title']);
			$this->assertMatchesRegularExpression('/^[A-Za-z0-9_.-]{1,128}$/', $tool['name']);
		}
	}

	public function testToolWithoutParametersPublishesEmptyObjectSchema()
	{
		$json = json_encode($this->CreateCatalog()->GetTools()[0]['inputSchema']);
		$this->assertStringContainsString('"properties":{}', $json);
	}

	public function testRequiredParametersArePublished()
	{
		$tools = $this->CreateCatalog()->GetTools();
		$summary = $tools[6];
		$this->assertSame('get_indicator_summary', $summary['name']);
		$this->assertSame(['indicator_id', 'version_id', 'level_id', 'region_ids'], $summary['inputSchema']['required']);
	}

	public function testShowMapRequiresOnlyTheLevel()
	{
		$tools = $this->CreateCatalog()->GetTools();
		$this->assertSame('show_map', $tools[5]['name']);
		$this->assertSame(['indicator_id', 'version_id', 'level_id'], $tools[5]['inputSchema']['required']);
	}

	public function testGuideTellsToOfferTheMapAndNotToShowIds()
	{
		$guide = McpToolCatalog::GetGuide();
		$this->assertStringContainsString('llamar show_map', $guide);
		$this->assertStringContainsString('no mostrarlos al usuario', $guide);
		$this->assertStringContainsString('El mapa no se dibuja en la conversación', $guide);
		$this->assertStringNotContainsString('incrustar', $guide);
		$this->assertStringNotContainsString('geometrías ni tablas', $guide);
	}

	public function testDefaultsAreResolved()
	{
		$args = $this->CreateCatalog()->NormalizeArguments('get_indicator_data', ['indicator_id' => 12, 'version_id' => 40, 'level_id' => 300]);
		$this->assertSame(200, $args['limit']);
		$this->assertSame(0, $args['offset']);
		$this->assertSame('asc', $args['order']);
		$this->assertSame([], $args['region_ids']);
		$this->assertNull($args['partition']);
		$this->assertNull($args['sort_by']);
	}

	public function testNumericStringsAreAcceptedAsIntegers()
	{
		$args = $this->CreateCatalog()->NormalizeArguments('describe_indicator', ['indicator_id' => '12']);
		$this->assertSame(12, $args['indicator_id']);
	}

	public function testRegionIdsAreDeduplicated()
	{
		$args = $this->CreateCatalog()->NormalizeArguments('get_indicator_summary',
			['indicator_id' => 1, 'version_id' => 2, 'level_id' => 3, 'region_ids' => [5, 5, '6']]);
		$this->assertSame([5, 6], $args['region_ids']);
	}

	public function testMissingRequiredParameter()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage("Falta el parámetro obligatorio 'indicator_id'");
		$this->CreateCatalog()->NormalizeArguments('describe_indicator', []);
	}

	public function testUnknownParameterListsValidOnes()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('Parámetros válidos: indicator_id');
		$this->CreateCatalog()->NormalizeArguments('describe_indicator', ['indicator_id' => 1, 'regions' => [1]]);
	}

	public function testGetCatalogRejectsParameters()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('Parámetros válidos: ninguno');
		$this->CreateCatalog()->NormalizeArguments('get_catalog', ['x' => 1]);
	}

	public function testLimitAboveMaximumIsRejected()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('no puede ser mayor que 1000');
		$this->CreateCatalog()->NormalizeArguments('get_indicator_data',
			['indicator_id' => 1, 'version_id' => 2, 'level_id' => 3, 'limit' => 5000]);
	}

	public function testInvalidOrderIsRejected()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('asc, desc');
		$this->CreateCatalog()->NormalizeArguments('get_indicator_data',
			['indicator_id' => 1, 'version_id' => 2, 'level_id' => 3, 'order' => 'arriba']);
	}

	public function testNonIntegerIdIsRejected()
	{
		$this->expectException(McpToolException::class);
		$this->CreateCatalog()->NormalizeArguments('describe_indicator', ['indicator_id' => 1.5]);
	}

	public function testShortQueryIsRejected()
	{
		$this->expectException(McpToolException::class);
		$this->CreateCatalog()->NormalizeArguments('find_regions', ['query' => 'a']);
	}

	public function testTooManyRegionsAreRejected()
	{
		$this->expectException(McpToolException::class);
		$this->CreateCatalog()->NormalizeArguments('get_indicator_summary',
			['indicator_id' => 1, 'version_id' => 2, 'level_id' => 3, 'region_ids' => range(1, 51)]);
	}

	public function testArgumentsThatAreNotAnObjectAreRejected()
	{
		$this->expectException(McpToolException::class);
		$this->CreateCatalog()->NormalizeArguments('describe_indicator', 'texto');
	}

	public function testRequiredRegionListMustNotBeEmpty()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('al menos un valor');
		$this->CreateCatalog()->NormalizeArguments('get_indicator_summary',
			['indicator_id' => 1, 'version_id' => 2, 'level_id' => 3, 'region_ids' => []]);
	}
}
