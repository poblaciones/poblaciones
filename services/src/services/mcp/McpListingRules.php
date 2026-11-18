<?php

namespace helena\services\mcp;

/**
 * Restricciones de uso de los listados (sección 7.2 de la especificación). No accede a la base.
 */
class McpListingRules
{
	/**
	 * Los listados de radios se hacen desde el mapa. La restricción alcanza solo a los niveles
	 * de geografía estándar (tipo D): un nivel de puntos o zonas puede estar georreferenciado
	 * contra una geografía restringida y su listado es válido.
	 */
	public static function IsListable(string $levelType, int $geographyId, array $restrictedGeographyIds): bool
	{
		return !($levelType === 'D' && in_array($geographyId, $restrictedGeographyIds, true));
	}

	public static function CheckLevelListable(string $levelType, int $geographyId, array $restrictedGeographyIds, string $mapUrl): void
	{
		if (!self::IsListable($levelType, $geographyId, $restrictedGeographyIds))
			throw new McpToolException('Este nivel no admite listados en el conector (por ejemplo, los radios). '
				. 'Usar get_indicator_summary con una región, o consultar el mapa: ' . $mapUrl);
	}

	/**
	 * Sin región, un nivel muy grande no se lista completo: se pide acotarlo.
	 */
	public static function CheckVolume(bool $hasRegions, int $totalRows, int $maxListableRows): void
	{
		if (!$hasRegions && $totalRows > $maxListableRows)
			throw new McpToolException('El nivel tiene ' . $totalRows . ' filas y el máximo sin recorte es ' . $maxListableRows
				. '. Indicar región o regiones en region_ids (se obtienen con find_regions o con el catálogo).');
	}

	/**
	 * @param array|null $partition Partición del nivel: name, mandatory, values[] { value, caption }.
	 */
	public static function CheckPartition(?array $partition, ?int $given): void
	{
		if ($partition === null)
		{
			if ($given !== null)
				throw new McpToolException('Este nivel no tiene particiones: omitir el parámetro partition.');
			return;
		}
		$validValues = [];
		foreach ($partition['values'] as $item)
		{
			if ($item['value'] !== '')
				$validValues[] = $item['value'];
		}
		if ($given === null)
		{
			if ($partition['mandatory'])
				throw new McpToolException("Este nivel exige el parámetro partition ('" . $partition['name']
					. "'). Valores válidos: " . implode(', ', self::DescribePartitionValues($partition)) . '.');
			return;
		}
		if (!in_array(strval($given), $validValues, true))
			throw new McpToolException("El valor " . $given . " no es válido para la partición '" . $partition['name']
				. "'. Valores válidos: " . implode(', ', self::DescribePartitionValues($partition)) . '.');
	}

	private static function DescribePartitionValues(array $partition): array
	{
		$items = [];
		foreach ($partition['values'] as $item)
		{
			if ($item['value'] !== '')
				$items[] = $item['value'] . '=' . $item['caption'];
		}
		return $items;
	}
}
