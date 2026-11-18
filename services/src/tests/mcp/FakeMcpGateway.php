<?php

namespace helena\tests\mcp;

use helena\services\mcp\IMcpGateway;
use helena\services\mcp\McpToolException;

/**
 * Pasarela de prueba: devuelve estructuras fijas y registra la última llamada.
 */
class FakeMcpGateway implements IMcpGateway
{
	public array $LastCall = [];

	public ?string $FailWith = null;

	private function Register(string $name, array $arguments): void
	{
		$this->LastCall = ['name' => $name, 'arguments' => $arguments];
		if ($this->FailWith !== null)
			throw new McpToolException($this->FailWith);
	}

	public function GetCatalog(): array
	{
		$this->Register('GetCatalog', []);
		return [
			'metadataUrlTemplate' => 'https://mapa.test/services/metadata/GetWorkMetadataPdf?w={id}',
			'indicatorGroups' => [['name' => 'Salud', 'providers' => [['name' => 'Ministerio', 'indicators' => [
				['id' => 12, 'name' => 'Mortalidad infantil', 'versions' => [
					['id' => 40, 'name' => '2022', 'workId' => 55, 'levels' => [['name' => 'Departamentos'], ['name' => 'Provincias']]]]]
			]]]]],
			'boundaryGroups' => [['name' => 'Políticas', 'boundaries' => [
				['id' => 3, 'name' => 'Departamentos', 'versionId' => 9, 'versionName' => '2022',
					'metadataUrl' => 'https://mapa.test/services/metadata/GetMetadataPdf?m=7', 'itemCount' => 3,
					'items' => [
						['id' => 101, 'code' => '10007', 'name' => 'Ambato', 'parentId' => 1012, 'parentName' => 'Catamarca'],
						['id' => 102, 'code' => '10014', 'name' => 'Ancasti', 'parentId' => 1012, 'parentName' => 'Catamarca'],
						['id' => 201, 'code' => '14007', 'name' => 'Calamuchita', 'parentId' => 1014, 'parentName' => 'Córdoba']]],
				['id' => 4, 'name' => 'Localidades', 'versionId' => 10, 'versionName' => '2022',
					'metadataUrl' => null, 'itemCount' => 5000, 'items' => null]
			]]],
			'inlineBoundaryItemsLimit' => 800
		];
	}

	public function DescribeIndicator(int $indicatorId): array
	{
		$this->Register('DescribeIndicator', [$indicatorId]);
		return [
			'id' => $indicatorId, 'name' => 'Mortalidad infantil',
			'versions' => [['id' => 40, 'name' => '2022', 'workId' => 55, 'work' => 'Estadísticas vitales',
				'metadataUrl' => 'https://mapa.test/services/metadata/GetWorkMetadataPdf?w=55', 'mapUrl' => 'https://mapa.test/map/55/#/l=12',
				'levels' => [['id' => 300, 'name' => 'Departamentos', 'type' => 'D', 'datasetName' => 'Defunciones', 'listable' => true,
					'partition' => ['name' => 'Sexo', 'mandatory' => false, 'allCaption' => 'Todos',
						'values' => [['value' => '', 'caption' => 'Todos'], ['value' => '1', 'caption' => 'Varón']]],
					'variables' => [
						['id' => 7, 'name' => 'Tasa', 'shortName' => 'tasa', 'formula' => '[Defunciones] / [Nacidos vivos] (cada mil)',
							'dataCaption' => 'Defunciones', 'normalizationCaption' => 'Nacidos vivos', 'available' => true, 'isCategorical' => false, 'isNormalized' => true, 'scale' => 1000, 'decimals' => 1,
							'isDefault' => true, 'legend' => null, 'categories' => []],
						['id' => 8, 'name' => 'Brecha', 'shortName' => 'brecha', 'formula' => 'brecha',
							'dataCaption' => null, 'normalizationCaption' => null, 'available' => false, 'isCategorical' => false, 'isNormalized' => false, 'scale' => null, 'decimals' => 0,
							'isDefault' => false, 'legend' => null, 'categories' => []]]]]]]
		];
	}

	public function DescribeBoundary(int $boundaryId): array
	{
		$this->Register('DescribeBoundary', [$boundaryId]);
		return ['id' => $boundaryId, 'name' => 'Departamentos', 'group' => 'Políticas', 'itemCount' => 530,
			'versions' => [['id' => 9, 'name' => '2022', 'metadataUrl' => 'https://mapa.test/services/metadata/GetMetadataPdf?m=7',
				'mapUrl' => 'https://mapa.test/map/b3']]];
	}

	public function FindRegions(string $query): array
	{
		$this->Register('FindRegions', [$query]);
		return ['regions' => [['id' => 1012, 'name' => 'Catamarca', 'location' => 'Argentina']]];
	}

	public function ListBoundaryItems(int $boundaryId, ?int $parentId, ?string $query, int $limit, int $offset): array
	{
		$this->Register('ListBoundaryItems', [$boundaryId, $parentId, $query, $limit, $offset]);
		return ['boundary' => ['id' => $boundaryId, 'name' => 'Localidades'], 'totalItems' => 5000, 'offset' => $offset,
			'items' => [['id' => 900, 'code' => null, 'name' => 'Fiambalá', 'parentId' => null, 'parentName' => null]]];
	}

	public function GetIndicatorSummary(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array
	{
		$this->Register('GetIndicatorSummary', [$indicatorId, $versionId, $levelId, $regionIds, $partition]);
		return [
			'source' => $this->Source(), 'level' => ['id' => $levelId, 'name' => 'Departamentos', 'type' => 'D'],
			'regions' => [['id' => 1012, 'name' => 'Catamarca']], 'partition' => null, 'notes' => [],
			'variables' => [
				['id' => 7, 'name' => 'Tasa', 'formula' => '[Defunciones] / [Nacidos vivos]', 'dataCaption' => 'Defunciones',
					'normalizationCaption' => 'Nacidos vivos', 'kind' => 'numeric', 'unit' => 'cada mil',
					'isNormalized' => true, 'decimals' => 1, 'value' => 8.2, 'quantity' => 119.0, 'total' => 14500.0, 'areas' => 16,
					'km2' => 100000.5, 'categories' => []],
				['id' => 10, 'name' => 'Densidad de población', 'formula' => '[Población total] / [Área km²]', 'dataCaption' => 'Población total',
					'normalizationCaption' => 'Área km²', 'kind' => 'numeric', 'unit' => 'razón',
					'isNormalized' => true, 'decimals' => 0, 'value' => 5016.7283, 'quantity' => 9219.0, 'total' => 1.8376, 'areas' => 10,
					'km2' => 1.84, 'categories' => []],
				['id' => 11, 'name' => 'Matrícula', 'formula' => '[Matrícula]', 'dataCaption' => 'Matrícula',
					'normalizationCaption' => '', 'kind' => 'numeric', 'unit' => 'cantidad',
					'isNormalized' => false, 'decimals' => 0, 'value' => 4210.0, 'quantity' => 4210.0, 'total' => null, 'areas' => 35,
					'km2' => 0.0, 'categories' => []],
				['id' => 9, 'name' => 'Tipo', 'formula' => 'Tipo', 'dataCaption' => 'Conteo', 'normalizationCaption' => '', 'kind' => 'categorical', 'unit' => 'cantidad',
					'isNormalized' => false, 'decimals' => 0, 'value' => null, 'quantity' => null, 'total' => null, 'areas' => 0, 'km2' => 0.0,
					'categories' => [['name' => 'Urbano', 'count' => 30.0, 'areas' => 3, 'km2' => 10.0, 'share' => 0.75],
						['name' => 'Rural', 'count' => 10.0, 'areas' => 1, 'km2' => 90.0, 'share' => 0.25]]]]
		];
	}

	public function GetMapLink(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array
	{
		$this->Register('GetMapLink', [$indicatorId, $versionId, $levelId, $regionIds, $partition]);
		return [
			'source' => $this->Source(), 'level' => ['id' => $levelId, 'name' => 'Departamentos', 'type' => 'D'],
			'regions' => [['id' => 1012, 'name' => 'Catamarca']], 'partition' => null
		];
	}

	public function GetIndicatorData(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		?string $sortBy, string $order, int $limit, int $offset): array
	{
		$this->Register('GetIndicatorData', [$indicatorId, $versionId, $levelId, $regionIds, $partition, $sortBy, $order, $limit, $offset]);
		return $this->DataResult();
	}

	public function GetDatasetRecords(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		array $columns, int $limit, int $offset): array
	{
		$this->Register('GetDatasetRecords', [$indicatorId, $versionId, $levelId, $regionIds, $partition, $columns, $limit, $offset]);
		return $this->DataResult();
	}

	private function Source(): array
	{
		return ['indicatorId' => 12, 'indicator' => 'Mortalidad infantil', 'versionId' => 40, 'version' => '2022', 'workId' => 55,
			'work' => 'Estadísticas vitales', 'metadataUrl' => 'https://mapa.test/services/metadata/GetWorkMetadataPdf?w=55',
			'mapUrl' => 'https://mapa.test/map/55/#/l=12'];
	}

	private function DataResult(): array
	{
		return [
			'source' => $this->Source(), 'level' => ['id' => 300, 'name' => 'Departamentos', 'type' => 'D'],
			'regions' => [['id' => 1012, 'name' => 'Catamarca']], 'partition' => null, 'totalRows' => 2, 'offset' => 0,
			'notes' => [], 'dictionaryOnly' => false,
			'columns' => [
				['name' => 'codigo', 'description' => 'Código del departamento', 'type' => 'texto', 'detail' => ''],
				['name' => 'nombre', 'description' => 'Nombre del departamento', 'type' => 'texto', 'detail' => ''],
				['name' => 'tasa', 'description' => 'Tasa', 'type' => 'número', 'detail' => 'cada mil']],
			'rows' => [['10007', 'Ambato', '8.2'], ['10014', 'Ancasti, sector norte', '']]
		];
	}
}
