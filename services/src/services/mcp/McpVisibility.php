<?php

namespace helena\services\mcp;

use helena\classes\App;
use helena\classes\Session;
use helena\services\frontend\BoundaryService;
use helena\services\frontend\FabService;

/**
 * Qué se expone en el conector. Parte de los mismos catálogos cacheados que usa el visor
 * (FabService) y aplica las mismas reglas de acceso (Session): el conector muestra lo que
 * vería un visitante sin credenciales ni enlace de acceso.
 */
class McpVisibility
{
	private ?array $indicatorGroups = null;

	private ?array $indicatorsById = null;

	private ?array $boundaries = null;

	private ?array $regionsById = null;

	/**
	 * Indicadores públicos, agrupados: [{ name, providers[] { name, indicators[] { id, name,
	 * versions[] { id, name, workId, work, levels[] { id, name } } } } }].
	 * Se omiten las series de cartografías privadas o con enlace de acceso.
	 */
	public function GetIndicatorGroups(): array
	{
		$this->LoadIndicators();
		return $this->indicatorGroups;
	}

	public function GetIndicator(int $indicatorId): ?array
	{
		$this->LoadIndicators();
		if (!array_key_exists($indicatorId, $this->indicatorsById))
			return null;
		return $this->indicatorsById[$indicatorId];
	}

	private function LoadIndicators(): void
	{
		if ($this->indicatorGroups !== null)
			return;
		$fab = new FabService();
		$this->indicatorGroups = [];
		$this->indicatorsById = [];
		foreach (App::JsonClone($fab->GetFabIndicators(false)) as $group)
		{
			// El grupo sin id es «Los más consultados», que repite indicadores de los demás.
			if ($group['Id'] !== null)
				$this->AddIndicatorGroup($group);
		}
	}

	private function AddIndicatorGroup(array $group): void
	{
		$providers = [];
		foreach ($group['Items'] as $providerName => $metrics)
		{
			$indicators = $this->BuildIndicators($metrics);
			if (count($indicators) > 0)
				$providers[] = ['name' => strval($providerName), 'indicators' => $indicators];
		}
		if (count($providers) > 0)
			$this->indicatorGroups[] = ['name' => $group['Name'], 'providers' => $providers];
	}

	private function BuildIndicators(array $metrics): array
	{
		$indicators = [];
		foreach ($metrics as $metric)
		{
			$versions = $this->BuildVersions($metric['Versions']);
			if (count($versions) > 0)
			{
				$indicator = ['id' => intval($metric['Id']), 'name' => $metric['Name'], 'versions' => $versions];
				$indicators[] = $indicator;
				$this->indicatorsById[$indicator['id']] = $indicator;
			}
		}
		return $indicators;
	}

	private function BuildVersions(array $versions): array
	{
		$ret = [];
		foreach ($versions as $version)
		{
			if (Session::IsWorkPublicOrAccessible(intval($version['WorkId'])))
			{
				$ret[] = ['id' => intval($version['Id']), 'name' => $version['Name'], 'workId' => intval($version['WorkId']),
					'work' => $version['Work'], 'levels' => $this->BuildLevelNames($version['Levels'])];
			}
		}
		return $ret;
	}

	private function BuildLevelNames(array $levels): array
	{
		$ret = [];
		foreach ($levels as $level)
		{
			$ret[] = ['id' => intval($level['Id']), 'name' => $level['Name']];
		}
		return $ret;
	}

	/**
	 * Delimitaciones visibles con sus ítems: [{ id, name, group, versions[] { id, name, metadataId },
	 * items[] { id, code, name, parentId, parentName } }]. La última versión es la vigente.
	 */
	public function GetBoundaries(): array
	{
		if ($this->boundaries !== null)
			return $this->boundaries;
		$fab = new FabService();
		$this->boundaries = [];
		foreach ($fab->GetBoundariesWithItems() as $group)
		{
			foreach ($group['Items'] as $boundary)
			{
				$this->boundaries[] = $this->BuildBoundary($boundary, $group['Name']);
			}
		}
		return $this->boundaries;
	}

	private function BuildBoundary(array $boundary, string $groupName): array
	{
		$id = intval($boundary['Id']);
		return [
			'id' => $id,
			'name' => $boundary['Name'],
			'group' => $groupName,
			'versions' => $this->GetBoundaryVersions($id),
			'items' => $this->FlattenItems($boundary)
		];
	}

	private function GetBoundaryVersions(int $boundaryId): array
	{
		$versions = [];
		$selected = (new BoundaryService())->GetSelectedBoundary($boundaryId);
		foreach ($selected->Versions as $version)
		{
			$metadataId = null;
			if ($version->Metadata !== null && $version->Metadata->Id !== null)
				$metadataId = intval($version->Metadata->Id);
			$versions[] = ['id' => intval($version->Id), 'name' => $version->Name, 'metadataId' => $metadataId];
		}
		return $versions;
	}

	private function FlattenItems(array $boundary): array
	{
		$items = [];
		if ($boundary['UseParent'])
		{
			foreach ($boundary['Items'] as $family)
			{
				$this->AppendFamilyItems($items, $family);
			}
		}
		else
		{
			foreach ($boundary['Items'] as $item)
			{
				$items[] = $this->BuildItem($item, null, null);
			}
		}
		return $items;
	}

	private function AppendFamilyItems(array &$items, array $family): void
	{
		$parentId = null;
		$parentName = null;
		if ($family['Id'] !== null && $family['Id'] !== '')
		{
			$parentId = intval($family['Id']);
			$parentName = $family['Name'];
		}
		foreach ($family['Items'] as $item)
		{
			$items[] = $this->BuildItem($item, $parentId, $parentName);
		}
	}

	private function BuildItem(array $item, ?int $parentId, ?string $parentName): array
	{
		$code = null;
		if (isset($item['Code']))
			$code = strval($item['Code']);
		return ['id' => intval($item['Id']), 'code' => $code, 'name' => $item['Name'], 'parentId' => $parentId, 'parentName' => $parentName];
	}

	public function GetBoundary(int $boundaryId): ?array
	{
		foreach ($this->GetBoundaries() as $boundary)
		{
			if ($boundary['id'] === $boundaryId)
				return $boundary;
		}
		return null;
	}

	public function RequireRegionsExposed(array $regionIds): void
	{
		foreach ($regionIds as $regionId)
		{
			if ($this->GetRegion($regionId) === null)
				throw new McpToolException('La región ' . $regionId . ' no pertenece a una delimitación pública. '
					. 'Obtener ids válidos con find_regions o con el catálogo.');
		}
	}

	public function IsRegionExposed(int $regionId): bool
	{
		return $this->GetRegion($regionId) !== null;
	}

	/**
	 * Ítem de delimitación { id, code, name, parentId, parentName } o null si no está expuesto.
	 */
	public function GetRegion(int $regionId): ?array
	{
		if ($this->regionsById === null)
		{
			$this->regionsById = [];
			foreach ($this->GetBoundaries() as $boundary)
			{
				foreach ($boundary['items'] as $item)
				{
					$this->regionsById[$item['id']] = $item;
				}
			}
		}
		if (!array_key_exists($regionId, $this->regionsById))
			return null;
		return $this->regionsById[$regionId];
	}

	/**
	 * Regiones expuestas como [{ id, name }], en el orden pedido.
	 */
	public function DescribeRegions(array $regionIds): array
	{
		$regions = [];
		foreach ($regionIds as $regionId)
		{
			$region = $this->GetRegion($regionId);
			if ($region !== null)
				$regions[] = ['id' => $regionId, 'name' => $region['name']];
		}
		return $regions;
	}
}
