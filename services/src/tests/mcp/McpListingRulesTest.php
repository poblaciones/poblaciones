<?php

namespace helena\tests\mcp;

use PHPUnit\Framework\TestCase;
use helena\services\mcp\McpListingRules;
use helena\services\mcp\McpToolException;

class McpListingRulesTest extends TestCase
{
	private function CreatePartition(bool $mandatory): array
	{
		return ['name' => 'Sexo', 'mandatory' => $mandatory, 'allCaption' => 'Todos',
			'values' => [['value' => '', 'caption' => 'Todos'], ['value' => '1', 'caption' => 'Varón'], ['value' => '2', 'caption' => 'Mujer']]];
	}

	public function testRestrictedGeographyIsRejectedForStandardLevels()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('https://mapa.test/map/55');
		McpListingRules::CheckLevelListable('D', 7, [7, 8], 'https://mapa.test/map/55');
	}

	public function testRestrictedGeographyIsAllowedForPointsAndZones()
	{
		McpListingRules::CheckLevelListable('L', 7, [7], 'https://mapa.test/map/55');
		McpListingRules::CheckLevelListable('S', 7, [7], 'https://mapa.test/map/55');
		$this->addToAssertionCount(1);
	}

	public function testUnrestrictedGeographyIsAllowed()
	{
		McpListingRules::CheckLevelListable('D', 3, [7], 'https://mapa.test/map/55');
		McpListingRules::CheckLevelListable('D', 3, [], 'https://mapa.test/map/55');
		$this->addToAssertionCount(1);
	}

	public function testVolumeWithoutRegionsIsRejectedAboveLimit()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('region_ids');
		McpListingRules::CheckVolume(false, 20001, 20000);
	}

	public function testVolumeAtLimitOrWithRegionsIsAllowed()
	{
		McpListingRules::CheckVolume(false, 20000, 20000);
		McpListingRules::CheckVolume(true, 500000, 20000);
		$this->addToAssertionCount(1);
	}

	public function testMandatoryPartitionIsRequired()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('1=Varón, 2=Mujer');
		McpListingRules::CheckPartition($this->CreatePartition(true), null);
	}

	public function testOptionalPartitionMayBeOmitted()
	{
		McpListingRules::CheckPartition($this->CreatePartition(false), null);
		McpListingRules::CheckPartition(null, null);
		McpListingRules::CheckPartition($this->CreatePartition(true), 2);
		$this->addToAssertionCount(1);
	}

	public function testUnknownPartitionValueIsRejected()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('no es válido');
		McpListingRules::CheckPartition($this->CreatePartition(false), 9);
	}

	public function testPartitionGivenForLevelWithoutPartitionsIsRejected()
	{
		$this->expectException(McpToolException::class);
		$this->expectExceptionMessage('no tiene particiones');
		McpListingRules::CheckPartition(null, 1);
	}
}
