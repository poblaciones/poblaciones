<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\services\mcp\McpDescriptionFormatter;

class McpDescriptionFormatterTest extends TestCase
{
	private FakeMcpGateway $gateway;

	public function setUp(): void
	{
		$this->gateway = new FakeMcpGateway();
	}

	public function testCatalogHasGuideIndicatorsAndBoundaries()
	{
		$text = McpDescriptionFormatter::FormatCatalog($this->gateway->GetCatalog());
		$this->assertStringContainsString('Conceptos', $text);
		$this->assertStringContainsString('GetWorkMetadataPdf?w={id}', $text);
		$this->assertStringContainsString("12|Mortalidad infantil|2022 (cart. 55)|Departamentos, Provincias\n", $text);
	}

	public function testCatalogGroupsBoundaryItemsByParent()
	{
		$text = McpDescriptionFormatter::FormatCatalog($this->gateway->GetCatalog());
		$this->assertStringContainsString("> Catamarca (id 1012)\n101|10007|Ambato\n102|10014|Ancasti\n> Córdoba (id 1014)\n201|14007|Calamuchita\n", $text);
	}

	public function testCatalogPointsToToolsWhenItemsAreNotIncluded()
	{
		$text = McpDescriptionFormatter::FormatCatalog($this->gateway->GetCatalog());
		$this->assertStringContainsString('Localidades (delimitación 4) · 5000 ítems', $text);
		$this->assertStringContainsString('usar find_regions o list_boundary_items', $text);
	}

	public function testIndicatorShowsLinksFormulaAndUnavailableVariables()
	{
		$text = McpDescriptionFormatter::FormatIndicator($this->gateway->DescribeIndicator(12));
		$this->assertStringContainsString('Metadatos (PDF): https://mapa.test/services/metadata/GetWorkMetadataPdf?w=55', $text);
		$this->assertStringContainsString('Nivel Departamentos (nivel 300)', $text);
		$this->assertStringContainsString('fórmula: [Defunciones] / [Nacidos vivos] (cada mil) · unidad: cada mil', $text);
		$this->assertStringContainsString('no disponible en este conector', $text);
		$this->assertStringContainsString('Partición «Sexo» (opcional; sin el parámetro se consulta «Todos»), parámetro partition: 1=Varón', $text);
	}

	public function testBoundaryShowsMetadataLinkPerVersion()
	{
		$text = McpDescriptionFormatter::FormatBoundary($this->gateway->DescribeBoundary(3));
		$this->assertStringContainsString('530 ítems', $text);
		$this->assertStringContainsString('GetMetadataPdf?m=7', $text);
	}

	public function testRegionsFoundAndNotFound()
	{
		$found = McpDescriptionFormatter::FormatRegions($this->gateway->FindRegions('Catamarca'), 'Catamarca');
		$this->assertStringContainsString('- id 1012 · Catamarca · Argentina', $found);
		$empty = McpDescriptionFormatter::FormatRegions(['regions' => []], 'Xyz');
		$this->assertStringContainsString('No se encontraron regiones', $empty);
	}

	public function testBoundaryItemsPaging()
	{
		$text = McpDescriptionFormatter::FormatBoundaryItems($this->gateway->ListBoundaryItems(4, null, null, 200, 0));
		$this->assertStringContainsString('Ítems 1–1 de 5000 · continúa con offset=1', $text);
		$this->assertStringContainsString("900||Fiambalá\n", $text);
	}

	public function testSummaryDeclaresCalculationAndLinks()
	{
		$text = McpDescriptionFormatter::FormatSummary($this->gateway->GetIndicatorSummary(12, 40, 300, [1012], null));
		$this->assertStringContainsString('Regiones: Catamarca', $text);
		$this->assertStringContainsString('Base de cálculo (denominador, Nacidos vivos): 14500', $text);
		$this->assertStringContainsString('Superficie: 100000.5 km2', $text);
	}

	public function testSummaryKeepsQuantityAndBaseOfNormalizedVariables()
	{
		$text = McpDescriptionFormatter::FormatSummary($this->gateway->GetIndicatorSummary(12, 40, 300, [1012], null));
		$this->assertStringContainsString("Resultado: 8.2\nCantidad (numerador, Defunciones): 119\n", $text);
		$this->assertStringContainsString("Resultado: 5016.73\nCantidad (numerador, Población total): 9219\n"
			. "Base de cálculo (denominador, Área km²): 1.84\n", $text);
	}

	public function testSummaryOfNonNormalizedVariableShowsQuantityAndElements()
	{
		$summary = $this->gateway->GetIndicatorSummary(12, 40, 300, [1012], null);
		$summary['level']['type'] = 'L';
		$text = McpDescriptionFormatter::FormatSummary($summary);
		$this->assertStringContainsString("### Matrícula\nFórmula: [Matrícula] · Unidad: cantidad\nCantidad: 4210\nPuntos: 35\n", $text);
	}

	public function testCategoryTableAddsTotal()
	{
		$text = McpDescriptionFormatter::FormatSummary($this->gateway->GetIndicatorSummary(12, 40, 300, [1012], null));
		$this->assertStringContainsString('Total de las categorías: 40', $text);
	}
}
