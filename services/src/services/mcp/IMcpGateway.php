<?php

namespace helena\services\mcp;

/**
 * Acceso a los datos que exponen las herramientas. Hay una implementación local
 * (servidor transaccional, con acceso a la base) y una remota (consulta por HTTP
 * a /services/mcp/* del servidor transaccional).
 *
 * Todas las respuestas son arreglos serializables a JSON. Los errores esperables se
 * informan con McpToolException.
 *
 * GetCatalog:
 *   metadataUrlTemplate (con {id} por el id de la cartografía),
 *   indicatorGroups[] { name, providers[] { name, indicators[] { id, name,
 *     versions[] { id, name, workId, levels[] { name } } } } }
 *   boundaryGroups[] { name, boundaries[] { id, name, versionId, versionName, metadataUrl,
 *     itemCount, items: null | { id, code, name, parentId, parentName }[] } }
 *   inlineBoundaryItemsLimit
 *
 * DescribeIndicator:
 *   id, name, versions[] { id, name, workId, work, metadataUrl, mapUrl,
 *     levels[] { id, name, type (D|L|S), datasetName, listable, partition,
 *       variables[] { id, name, shortName, formula, available, isCategorical, isNormalized,
 *         scale, decimals, isDefault, legend, categories[] { id, name } } } }
 *
 * DescribeBoundary:
 *   id, name, group, itemCount, versions[] { id, name, metadataUrl, mapUrl }
 *
 * FindRegions:
 *   regions[] { id, name, location }
 *
 * ListBoundaryItems:
 *   boundary { id, name }, totalItems, offset, items[] { id, code, name, parentId, parentName }
 *
 * GetIndicatorSummary:
 *   source { indicatorId, indicator, versionId, version, workId, work, metadataUrl, mapUrl },
 *   level { id, name, type }, regions[] { id, name }, partition { name, caption } | null, notes[],
 *   variables[] { id, name, formula, dataCaption, normalizationCaption, kind (numeric|categorical), unit,
 *     isNormalized, decimals, value (resultado), quantity (cantidad del numerador; igual a value si no está
 *     normalizada), total (base de cálculo, solo si está normalizada), areas, km2,
 *     categories[] { name, count, areas, km2, share } }
 *
 * GetMapLink:
 *   source (igual que en GetIndicatorSummary), level, regions, partition
 *
 * GetIndicatorData y GetDatasetRecords:
 *   source, level, regions, partition, totalRows, offset, notes[],
 *   columns[] { name, description, type, detail }, rows[][] (celdas ya formateadas como texto),
 *   dictionaryOnly (true cuando se pide elegir columnas antes de listar)
 */
interface IMcpGateway
{
	public function GetCatalog(): array;

	public function DescribeIndicator(int $indicatorId): array;

	public function DescribeBoundary(int $boundaryId): array;

	public function FindRegions(string $query): array;

	public function ListBoundaryItems(int $boundaryId, ?int $parentId, ?string $query, int $limit, int $offset): array;

	public function GetIndicatorSummary(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array;

	public function GetMapLink(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array;

	public function GetIndicatorData(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		?string $sortBy, string $order, int $limit, int $offset): array;

	public function GetDatasetRecords(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		array $columns, int $limit, int $offset): array;
}
