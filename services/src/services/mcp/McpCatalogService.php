<?php

namespace helena\services\mcp;

use helena\classes\App;
use helena\db\frontend\SnapshotSearchRegions;
use helena\entities\frontend\metric\LevelInfo;
use helena\entities\frontend\metric\VariableInfo;
use helena\services\frontend\SelectedMetricService;

/**
 * Catálogo, descripción de indicadores y delimitaciones, y búsqueda de regiones. Reutiliza los
 * servicios del visor y devuelve solo lo descriptivo (sin colores, símbolos ni estado de pantalla).
 */
class McpCatalogService
{
	private McpVisibility $visibility;

	public function __construct(McpVisibility $visibility)
	{
		$this->visibility = $visibility;
	}

	public function GetCatalog(): array
	{
		$limit = App::Settings()->Mcp()->InlineBoundaryItemsLimit;
		return [
			'metadataUrlTemplate' => McpLinks::WorkMetadataTemplate(),
			'indicatorGroups' => $this->BuildCatalogIndicatorGroups(),
			'boundaryGroups' => $this->BuildCatalogBoundaryGroups($limit),
			'inlineBoundaryItemsLimit' => $limit
		];
	}

	private function BuildCatalogIndicatorGroups(): array
	{
		$groups = [];
		foreach ($this->visibility->GetIndicatorGroups() as $group)
		{
			$providers = [];
			foreach ($group['providers'] as $provider)
			{
				$providers[] = ['name' => $provider['name'], 'indicators' => $this->BuildCatalogIndicators($provider['indicators'])];
			}
			$groups[] = ['name' => $group['name'], 'providers' => $providers];
		}
		return $groups;
	}

	private function BuildCatalogIndicators(array $indicators): array
	{
		$items = [];
		foreach ($indicators as $indicator)
		{
			$versions = [];
			foreach ($indicator['versions'] as $version)
			{
				$levels = [];
				foreach ($version['levels'] as $level)
				{
					$levels[] = ['name' => $level['name']];
				}
				$versions[] = ['id' => $version['id'], 'name' => $version['name'], 'workId' => $version['workId'], 'levels' => $levels];
			}
			$items[] = ['id' => $indicator['id'], 'name' => $indicator['name'], 'versions' => $versions];
		}
		return $items;
	}

	private function BuildCatalogBoundaryGroups(int $inlineLimit): array
	{
		$groups = [];
		$groupPositions = [];
		foreach ($this->visibility->GetBoundaries() as $boundary)
		{
			if (!array_key_exists($boundary['group'], $groupPositions))
			{
				$groupPositions[$boundary['group']] = count($groups);
				$groups[] = ['name' => $boundary['group'], 'boundaries' => []];
			}
			$groups[$groupPositions[$boundary['group']]]['boundaries'][] = $this->BuildCatalogBoundary($boundary, $inlineLimit);
		}
		return $groups;
	}

	private function BuildCatalogBoundary(array $boundary, int $inlineLimit): array
	{
		$itemCount = count($boundary['items']);
		$items = null;
		if ($itemCount <= $inlineLimit)
			$items = $boundary['items'];
		$current = ['id' => null, 'name' => null, 'metadataId' => null];
		if (count($boundary['versions']) > 0)
			$current = $boundary['versions'][count($boundary['versions']) - 1];
		return [
			'id' => $boundary['id'],
			'name' => $boundary['name'],
			'versionId' => $current['id'],
			'versionName' => $current['name'],
			'metadataUrl' => McpLinks::BoundaryMetadata($current['metadataId']),
			'itemCount' => $itemCount,
			'items' => $items
		];
	}

	public function DescribeIndicator(int $indicatorId): array
	{
		$indicator = $this->visibility->GetIndicator($indicatorId);
		if ($indicator === null)
			throw new McpToolException('El indicador ' . $indicatorId . ' no existe o no es público. Consultar get_catalog.');
		$selected = (new SelectedMetricService())->GetSelectedMetric($indicatorId, false);
		if ($selected === null)
			throw new McpToolException('El indicador ' . $indicatorId . ' no tiene información publicada.');

		$exposedVersionIds = array_column($indicator['versions'], 'id');
		$versions = [];
		$versionPosition = 0;
		foreach ($selected->Versions as $selectedVersion)
		{
			if (in_array(intval($selectedVersion->Version->Id), $exposedVersionIds, true))
				$versions[] = $this->DescribeVersion($indicatorId, $selectedVersion, $versionPosition);
			$versionPosition++;
		}
		return ['id' => $indicatorId, 'name' => $indicator['name'], 'versions' => $versions];
	}

	private function DescribeVersion(int $indicatorId, $selectedVersion, int $versionPosition): array
	{
		$workId = intval($selectedVersion->Version->WorkId);
		$levels = [];
		foreach ($selectedVersion->Levels as $level)
		{
			$levels[] = $this->DescribeLevel($level);
		}
		return [
			'id' => intval($selectedVersion->Version->Id),
			'name' => $selectedVersion->Version->Name,
			'workId' => $workId,
			'work' => $selectedVersion->Version->Work,
			'metadataUrl' => McpLinks::WorkMetadata($workId),
			'mapUrl' => McpLinks::WorkMap($workId, McpMapRoute::BuildMetric($indicatorId, $versionPosition, null, null, false)),
			'levels' => $levels
		];
	}

	private function DescribeLevel(LevelInfo $level): array
	{
		$restricted = App::Settings()->Mcp()->ListingRestrictedGeographyIds;
		$variables = [];
		foreach ($level->Variables as $variable)
		{
			$variables[] = self::DescribeVariable($variable);
		}
		return [
			'id' => intval($level->Id),
			'name' => $level->Name,
			'type' => $level->Dataset->Type,
			'datasetName' => $level->Dataset->Name,
			'listable' => McpListingRules::IsListable($level->Dataset->Type, intval($level->GeographyId), $restricted),
			'partition' => $this->DescribePartition($level->Partitions),
			'variables' => $variables
		];
	}

	public static function DescribePartition($partition): ?array
	{
		if ($partition === null)
			return null;
		$values = [];
		foreach ($partition->Values as $value)
		{
			$values[] = ['value' => strval($value['Value']), 'caption' => $value['Caption']];
		}
		return ['name' => $partition->Name, 'mandatory' => (bool)$partition->Mandatory,
			'allCaption' => $partition->AllCaption, 'values' => $values];
	}

	public static function DescribeVariable(VariableInfo $variable): array
	{
		$scale = null;
		if ($variable->NormalizationScale !== null)
			$scale = floatval($variable->NormalizationScale);
		$categories = [];
		if ($variable->IsCategorical)
		{
			foreach ($variable->ValueLabels as $label)
			{
				$categories[] = ['id' => intval($label->Id), 'name' => $label->Name];
			}
		}
		return [
			'id' => intval($variable->Id),
			'name' => $variable->Name,
			'shortName' => $variable->ShortName,
			'formula' => $variable->Formula,
			'dataCaption' => $variable->DataCaption,
			'normalizationCaption' => $variable->NormalizationCaption,
			'available' => !$variable->IsGap,
			'isCategorical' => (bool)$variable->IsCategorical,
			'isNormalized' => $variable->Normalization !== null,
			'scale' => $scale,
			'decimals' => intval($variable->Decimals),
			'isDefault' => (bool)$variable->IsDefault,
			'legend' => $variable->Legend,
			'categories' => $categories
		];
	}

	public function DescribeBoundary(int $boundaryId): array
	{
		$boundary = $this->RequireBoundary($boundaryId);
		$versions = [];
		foreach ($boundary['versions'] as $version)
		{
			$versions[] = ['id' => $version['id'], 'name' => $version['name'],
				'metadataUrl' => McpLinks::BoundaryMetadata($version['metadataId']), 'mapUrl' => McpLinks::BoundaryMap($boundaryId)];
		}
		return ['id' => $boundaryId, 'name' => $boundary['name'], 'group' => $boundary['group'],
			'itemCount' => count($boundary['items']), 'versions' => $versions];
	}

	private function RequireBoundary(int $boundaryId): array
	{
		$boundary = $this->visibility->GetBoundary($boundaryId);
		if ($boundary === null)
			throw new McpToolException('La delimitación ' . $boundaryId . ' no existe o no es pública. Consultar get_catalog.');
		return $boundary;
	}

	public function FindRegions(string $query): array
	{
		$regions = [];
		foreach ((new SnapshotSearchRegions())->SearchClippingRegions($query) as $row)
		{
			if ($this->visibility->IsRegionExposed(intval($row['Id'])))
				$regions[] = ['id' => intval($row['Id']), 'name' => $row['Caption'], 'location' => $row['Extra']];
		}
		return ['regions' => $regions];
	}

	public function ListBoundaryItems(int $boundaryId, ?int $parentId, ?string $query, int $limit, int $offset): array
	{
		$boundary = $this->RequireBoundary($boundaryId);
		$matches = [];
		foreach ($boundary['items'] as $item)
		{
			if ($this->ItemMatches($item, $parentId, $query))
				$matches[] = $item;
		}
		return [
			'boundary' => ['id' => $boundaryId, 'name' => $boundary['name']],
			'totalItems' => count($matches),
			'offset' => $offset,
			'items' => array_slice($matches, $offset, $limit)
		];
	}

	private function ItemMatches(array $item, ?int $parentId, ?string $query): bool
	{
		if ($parentId !== null && $item['parentId'] !== $parentId)
			return false;
		if ($query === null)
			return true;
		return strpos(McpTextFormatter::Slug($item['name']), McpTextFormatter::Slug($query)) !== false;
	}
}
