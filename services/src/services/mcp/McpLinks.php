<?php

namespace helena\services\mcp;

use helena\classes\Links;

/**
 * Enlaces absolutos a metadatos y mapas que acompañan cada respuesta del conector.
 */
class McpLinks
{
	public static function WorkMetadata(int $workId): string
	{
		return Links::GetFullyQualifiedUrl(Links::GetWorkMetadataUrl($workId));
	}

	public static function WorkMetadataTemplate(): string
	{
		return Links::GetFullyQualifiedUrl(Links::GetWorkMetadataUrl('{id}'));
	}

	/**
	 * Mapa del indicador en el visor. $metricRoute lo arma McpMapRoute::BuildMetric.
	 */
	public static function WorkMap(int $workId, string $metricRoute, array $regionIds = []): string
	{
		return Links::GetFullyQualifiedUrl(Links::GetWorkMetricUrl($workId, $metricRoute, McpMapRoute::JoinRegionIds($regionIds)));
	}

	public static function BoundaryMetadata($metadataId): ?string
	{
		if ($metadataId === null)
			return null;
		return Links::GetFullyQualifiedUrl(Links::GetMetadataUrl(intval($metadataId)));
	}

	public static function BoundaryMap(int $boundaryId): string
	{
		return Links::GetBoundaryStableUrl($boundaryId);
	}
}
