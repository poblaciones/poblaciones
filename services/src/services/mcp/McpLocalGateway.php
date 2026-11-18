<?php

namespace helena\services\mcp;

use minga\framework\PublicException;

/**
 * Pasarela para el servidor que tiene acceso a la base de datos.
 */
class McpLocalGateway implements IMcpGateway
{
	private McpCatalogService $catalog;

	private McpDataService $data;

	public function __construct()
	{
		$visibility = new McpVisibility();
		$this->catalog = new McpCatalogService($visibility);
		$this->data = new McpDataService($visibility);
	}

	public function GetCatalog(): array
	{
		return $this->Run(function () {
			return $this->catalog->GetCatalog();
		});
	}

	public function DescribeIndicator(int $indicatorId): array
	{
		return $this->Run(function () use ($indicatorId) {
			return $this->catalog->DescribeIndicator($indicatorId);
		});
	}

	public function DescribeBoundary(int $boundaryId): array
	{
		return $this->Run(function () use ($boundaryId) {
			return $this->catalog->DescribeBoundary($boundaryId);
		});
	}

	public function FindRegions(string $query): array
	{
		return $this->Run(function () use ($query) {
			return $this->catalog->FindRegions($query);
		});
	}

	public function ListBoundaryItems(int $boundaryId, ?int $parentId, ?string $query, int $limit, int $offset): array
	{
		return $this->Run(function () use ($boundaryId, $parentId, $query, $limit, $offset) {
			return $this->catalog->ListBoundaryItems($boundaryId, $parentId, $query, $limit, $offset);
		});
	}

	public function GetIndicatorSummary(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array
	{
		return $this->Run(function () use ($indicatorId, $versionId, $levelId, $regionIds, $partition) {
			return $this->data->GetIndicatorSummary($indicatorId, $versionId, $levelId, $regionIds, $partition);
		});
	}

	public function GetMapLink(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array
	{
		return $this->Run(function () use ($indicatorId, $versionId, $levelId, $regionIds, $partition) {
			return $this->data->GetMapLink($indicatorId, $versionId, $levelId, $regionIds, $partition);
		});
	}

	public function GetIndicatorData(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		?string $sortBy, string $order, int $limit, int $offset): array
	{
		return $this->Run(function () use ($indicatorId, $versionId, $levelId, $regionIds, $partition, $sortBy, $order, $limit, $offset) {
			return $this->data->GetIndicatorData($indicatorId, $versionId, $levelId, $regionIds, $partition, $sortBy, $order, $limit, $offset);
		});
	}

	public function GetDatasetRecords(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		array $columns, int $limit, int $offset): array
	{
		return $this->Run(function () use ($indicatorId, $versionId, $levelId, $regionIds, $partition, $columns, $limit, $offset) {
			return $this->data->GetDatasetRecords($indicatorId, $versionId, $levelId, $regionIds, $partition, $columns, $limit, $offset);
		});
	}

	/**
	 * Los servicios del visor informan los pedidos inválidos con PublicException. Se las convierte en
	 * errores de herramienta conservando el mensaje, que le indica al asistente cómo corregir el pedido.
	 */
	private function Run(callable $operation): array
	{
		try
		{
			return $operation();
		}
		catch (PublicException $exception)
		{
			throw new McpToolException($exception->getPublicMessage(), 0, $exception);
		}
	}
}
