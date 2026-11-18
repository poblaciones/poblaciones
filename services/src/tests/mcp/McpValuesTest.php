<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\services\mcp\McpValues;

class McpValuesTest extends TestCase
{
	public function testResolveRatioAppliesScale()
	{
		$this->assertEqualsWithDelta(8.2, McpValues::ResolveRatio(82, 10000, 1000), 0.0001);
	}

	public function testResolveRatioWithoutScaleUsesOne()
	{
		$this->assertEqualsWithDelta(0.25, McpValues::ResolveRatio(1, 4, null), 0.0001);
	}

	public function testResolveRatioReturnsNullWhenTotalIsZeroOrMissing()
	{
		$this->assertNull(McpValues::ResolveRatio(5, 0, 100));
		$this->assertNull(McpValues::ResolveRatio(5, null, 100));
		$this->assertNull(McpValues::ResolveRatio(null, 5, 100));
	}

	public function testSummarizeNumericNormalizedSumsGroupsBeforeDividing()
	{
		$rows = [
			['Value' => 10, 'Total' => 100, 'Count' => 2, 'Km2' => 1.5],
			['Value' => 20, 'Total' => 300, 'Count' => 3, 'Km2' => 2]
		];
		$summary = McpValues::SummarizeNumeric($rows, true, 100);
		$this->assertEqualsWithDelta(7.5, $summary['value'], 0.0001);
		$this->assertEquals(400, $summary['total']);
		$this->assertEquals(30, $summary['quantity']);
		$this->assertSame(5, $summary['areas']);
		$this->assertEqualsWithDelta(3.5, $summary['km2'], 0.0001);
	}

	public function testSummarizeNumericWithoutNormalizationSumsValues()
	{
		$rows = [['Value' => 10, 'Count' => 2, 'Km2' => 1], ['Value' => 5, 'Count' => 1, 'Km2' => 1]];
		$summary = McpValues::SummarizeNumeric($rows, false, null);
		$this->assertEquals(15, $summary['value']);
		$this->assertEquals(15, $summary['quantity']);
		$this->assertNull($summary['total']);
	}

	public function testSummarizeNumericNormalizedWithoutTotalsHasNoValue()
	{
		$summary = McpValues::SummarizeNumeric([['Value' => 10, 'Count' => 2, 'Km2' => 1]], true, 100);
		$this->assertNull($summary['value']);
		$this->assertEquals(10, $summary['quantity']);
	}

	public function testSummarizeNumericKeepsQuantityWhenTotalIsZero()
	{
		$summary = McpValues::SummarizeNumeric([['Value' => 10, 'Total' => 0, 'Count' => 2, 'Km2' => 1]], true, 100);
		$this->assertNull($summary['value']);
		$this->assertEquals(10, $summary['quantity']);
		$this->assertEquals(0, $summary['total']);
	}

	public function testFormatAmountKeepsFractionsOfSmallBases()
	{
		$this->assertSame('1.84', McpValues::FormatAmount(1.8376, 0));
		$this->assertSame('9219', McpValues::FormatAmount(9219.0, 0));
		$this->assertSame('12.345', McpValues::FormatAmount(12.345, 3));
		$this->assertSame('', McpValues::FormatAmount(null, 0));
	}

	public function testElementsLabelByLevelType()
	{
		$this->assertSame('Áreas', McpValues::ElementsLabel('D'));
		$this->assertSame('Puntos', McpValues::ElementsLabel('L'));
		$this->assertSame('Zonas', McpValues::ElementsLabel('S'));
	}

	public function testTermLabelFallsBackWhenCaptionIsMissing()
	{
		$this->assertSame('Hogares', McpValues::TermLabel('Hogares', 'otro'));
		$this->assertSame('otro', McpValues::TermLabel(null, 'otro'));
		$this->assertSame('otro', McpValues::TermLabel('', 'otro'));
	}

	public function testSummarizeNumericEmpty()
	{
		$summary = McpValues::SummarizeNumeric([], true, 100);
		$this->assertNull($summary['value']);
		$this->assertSame(0, $summary['areas']);
	}

	public function testSummarizeCategoriesComputesSharesAndKeepsLabelOrder()
	{
		$rows = [
			['Value' => 10, 'Count' => 1, 'Km2' => 5, 'ValueId' => 22],
			['Value' => 30, 'Count' => 3, 'Km2' => 1, 'ValueId' => 21],
			['Value' => 10, 'Count' => 1, 'Km2' => 1, 'ValueId' => null]
		];
		$summary = McpValues::SummarizeCategories($rows, [21 => 'Urbano', 22 => 'Rural']);
		$this->assertSame('Urbano', $summary[0]['name']);
		$this->assertSame('Rural', $summary[1]['name']);
		$this->assertSame('Sin categoría', $summary[2]['name']);
		$this->assertEqualsWithDelta(0.6, $summary[0]['share'], 0.0001);
		$this->assertSame(3, $summary[0]['areas']);
	}

	public function testSummarizeCategoriesAddsRowsWithSameCategory()
	{
		$rows = [
			['Value' => 1, 'Count' => 1, 'Km2' => 1, 'ValueId' => 21],
			['Value' => 2, 'Count' => 2, 'Km2' => 1, 'ValueId' => 21]
		];
		$summary = McpValues::SummarizeCategories($rows, [21 => 'Urbano']);
		$this->assertCount(1, $summary);
		$this->assertEquals(3, $summary[0]['count']);
		$this->assertEqualsWithDelta(1.0, $summary[0]['share'], 0.0001);
	}

	public function testSummarizeCategoriesUnknownIdGetsGenericName()
	{
		$summary = McpValues::SummarizeCategories([['Value' => 1, 'Count' => 1, 'Km2' => 1, 'ValueId' => 99]], []);
		$this->assertSame('Categoría 99', $summary[0]['name']);
	}

	public function testUnitLabels()
	{
		$this->assertSame('cantidad', McpValues::UnitLabel(false, null));
		$this->assertSame('porcentaje', McpValues::UnitLabel(true, 100));
		$this->assertSame('cada mil', McpValues::UnitLabel(true, 1000));
		$this->assertSame('cada cien mil', McpValues::UnitLabel(true, 100000));
		$this->assertSame('razón', McpValues::UnitLabel(true, 1));
		$this->assertSame('por cada 250', McpValues::UnitLabel(true, 250));
	}

	public function testEffectiveDecimalsRaisesNormalizedOnly()
	{
		$this->assertSame(2, McpValues::EffectiveDecimals(0, true));
		$this->assertSame(3, McpValues::EffectiveDecimals(3, true));
		$this->assertSame(0, McpValues::EffectiveDecimals(0, false));
	}

	public function testFormatNumber()
	{
		$this->assertSame('8.2', McpValues::FormatNumber(8.2, 2));
		$this->assertSame('8', McpValues::FormatNumber(8.0, 2));
		$this->assertSame('1235', McpValues::FormatNumber(1234.6, 0));
		$this->assertSame('', McpValues::FormatNumber(null, 2));
		$this->assertSame('0', McpValues::FormatNumber(-0.0001, 2));
		$this->assertSame('1234567.5', McpValues::FormatNumber(1234567.5, 1));
	}
}
