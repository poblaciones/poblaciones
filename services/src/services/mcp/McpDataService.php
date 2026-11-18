<?php

namespace helena\services\mcp;

use helena\classes\App;
use helena\classes\spss\Format;
use helena\db\frontend\DatasetDownloadModel;
use helena\db\frontend\GeographyItemModel;
use helena\db\frontend\McpModel;
use helena\entities\frontend\geometries\Frame;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\services\frontend\SelectedMetricService;
use helena\services\frontend\SummaryService;
use helena\services\frontend\TableService;

/**
 * Resumen, datos por área y registros de un nivel de indicador. Todo el cálculo lo hacen los servicios
 * del visor (SummaryService, TableService, DatasetDownloadModel), con su caché y sus reglas; este servicio
 * solo valida lo que se expone, adapta la forma de la respuesta y resuelve los valores para el asistente.
 */
class McpDataService
{
	const LABELS_IN_DICTIONARY = 12;

	const DEFAULT_RECORD_DECIMALS = 6;

	const LEVEL_TYPE_NAMES = ['D' => 'áreas estándar', 'L' => 'puntos', 'S' => 'zonas'];

	private McpVisibility $visibility;

	public function __construct(McpVisibility $visibility)
	{
		$this->visibility = $visibility;
	}

	public function GetIndicatorSummary(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array
	{
		$context = $this->ResolveContext($indicatorId, $versionId, $levelId);
		$level = $context['level'];
		$this->visibility->RequireRegionsExposed($regionIds);
		$partitionDescription = McpCatalogService::DescribePartition($level->Partitions);
		McpListingRules::CheckPartition($partitionDescription, $partition);

		$frame = new Frame();
		$frame->ClippingRegionIds = $regionIds;
		$summary = (new SummaryService())->GetSummary($frame, $indicatorId, $versionId, $levelId, null, null, $partition);
		$rowsByVariable = $this->GroupSummaryRows($summary->Items);

		$variables = [];
		$omittedGaps = 0;
		foreach ($level->Variables as $variable)
		{
			if ($variable->IsGap)
				$omittedGaps++;
			else
				$variables[] = $this->SummarizeVariable(McpCatalogService::DescribeVariable($variable), $rowsByVariable);
		}
		return [
			'source' => $this->WithMapLink($context, $regionIds, $partition),
			'level' => $context['levelInfo'],
			'regions' => $this->visibility->DescribeRegions($regionIds),
			'partition' => $this->DescribeSelectedPartition($partitionDescription, $partition),
			'notes' => $this->BuildSummaryNotes($omittedGaps),
			'variables' => $variables
		];
	}

	public function GetMapLink(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition): array
	{
		$context = $this->ResolveContext($indicatorId, $versionId, $levelId);
		$this->visibility->RequireRegionsExposed($regionIds);
		$partitionDescription = McpCatalogService::DescribePartition($context['level']->Partitions);
		McpListingRules::CheckPartition($partitionDescription, $partition);
		return [
			'source' => $this->WithMapLink($context, $regionIds, $partition),
			'level' => $context['levelInfo'],
			'regions' => $this->visibility->DescribeRegions($regionIds),
			'partition' => $this->DescribeSelectedPartition($partitionDescription, $partition)
		];
	}

	/**
	 * Enlace al mapa del nivel consultado, recortado a las regiones pedidas (el visor admite varias) y con la
	 * partición elegida, para que el mapa muestre lo mismo que el resultado.
	 */
	private function WithMapLink(array $context, array $regionIds, ?int $partition): array
	{
		$source = $context['source'];
		$target = $context['mapTarget'];
		$metricRoute = McpMapRoute::BuildMetric(intval($source['indicatorId']), $target['versionPosition'], $target['levelPosition'],
			$partition, $target['pinLevel']);
		$source['mapUrl'] = McpLinks::WorkMap(intval($source['workId']), $metricRoute, $regionIds);
		return $source;
	}

	private function BuildSummaryNotes(int $omittedGaps): array
	{
		if ($omittedGaps === 0)
			return [];
		return ['Se omiten ' . $omittedGaps . ' variables de brecha, que el conector no expone.'];
	}

	private function GroupSummaryRows(array $items): array
	{
		$rowsByVariable = [];
		foreach ($items as $item)
		{
			$rowsByVariable[intval($item->VariableId)][] = [
				'Value' => $item->Value, 'Total' => $item->Total, 'Count' => $item->Count,
				'Km2' => $item->Km2, 'ValueId' => $item->ValueId
			];
		}
		return $rowsByVariable;
	}

	private function SummarizeVariable(array $variable, array $rowsByVariable): array
	{
		$rows = [];
		if (array_key_exists($variable['id'], $rowsByVariable))
			$rows = $rowsByVariable[$variable['id']];
		$summary = [
			'id' => $variable['id'],
			'name' => $variable['name'],
			'formula' => $variable['formula'],
			'kind' => 'numeric',
			'unit' => McpValues::UnitLabel($variable['isNormalized'], $variable['scale']),
			'isNormalized' => $variable['isNormalized'],
			'decimals' => $variable['decimals'],
			'dataCaption' => $variable['dataCaption'],
			'normalizationCaption' => $variable['normalizationCaption'],
			'value' => null, 'quantity' => null, 'total' => null, 'areas' => 0, 'km2' => 0.0, 'categories' => []
		];
		if ($variable['isCategorical'])
		{
			$summary['kind'] = 'categorical';
			$summary['categories'] = McpValues::SummarizeCategories($rows, $this->GetCategoryNames($variable));
			return $summary;
		}
		$numeric = McpValues::SummarizeNumeric($rows, $variable['isNormalized'], $variable['scale']);
		return array_merge($summary, $numeric);
	}

	private function GetCategoryNames(array $variable): array
	{
		$names = [];
		foreach ($variable['categories'] as $category)
		{
			$names[$category['id']] = $category['name'];
		}
		return $names;
	}

	public function GetIndicatorData(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		?string $sortBy, string $order, int $limit, int $offset): array
	{
		$context = $this->ResolveContext($indicatorId, $versionId, $levelId);
		$level = $context['level'];
		$settings = App::Settings()->Mcp();
		if ($level->Dataset->Type !== 'D')
			throw new McpToolException("El nivel «" . $level->Name . "» es de " . self::LEVEL_TYPE_NAMES[$level->Dataset->Type]
				. ': get_indicator_data solo admite niveles de áreas estándar. Usar get_dataset_records.');
		McpListingRules::CheckLevelListable($level->Dataset->Type, intval($level->GeographyId),
			$settings->ListingRestrictedGeographyIds, $context['source']['mapUrl']);
		$this->visibility->RequireRegionsExposed($regionIds);
		$partitionDescription = McpCatalogService::DescribePartition($level->Partitions);
		McpListingRules::CheckPartition($partitionDescription, $partition);

		$hasRegions = count($regionIds) > 0;
		if (!$hasRegions)
		{
			$snapshotTable = SnapshotByDatasetModel::SnapshotTable($level->Dataset->Table);
			McpListingRules::CheckVolume(false, (new McpModel())->CountSnapshotRows($snapshotTable, $partition), $settings->MaxListableRows);
		}
		$items = $this->LoadAreaRows($indicatorId, $versionId, $levelId, $partition, $regionIds);
		$geographyItems = (new GeographyItemModel())->GetNamesByIds($this->ListAreaIds($items));
		$table = McpIndicatorTable::Build($this->ListAvailableVariables($level), $items, $geographyItems, $sortBy, $order, $limit, $offset);
		return [
			'source' => $this->WithMapLink($context, $regionIds, $partition),
			'level' => $context['levelInfo'],
			'regions' => $this->visibility->DescribeRegions($regionIds),
			'partition' => $this->DescribeSelectedPartition($partitionDescription, $partition),
			'totalRows' => $table['totalRows'],
			'offset' => $offset,
			'notes' => [],
			'columns' => $table['columns'],
			'rows' => $table['rows'],
			'dictionaryOnly' => false
		];
	}

	private function LoadAreaRows(int $indicatorId, int $versionId, int $levelId, ?int $partition, array $regionIds): array
	{
		$tableService = new TableService();
		if (count($regionIds) > 0)
			$data = $tableService->GetTableMetricDataByRegions($indicatorId, $versionId, $levelId, $partition, $regionIds);
		else
			$data = $tableService->GetTableMetricData($indicatorId, $versionId, $levelId, $partition);
		return $data->Items;
	}

	private function ListAreaIds(array $items): array
	{
		$ids = [];
		foreach ($items as $item)
		{
			$ids[intval($item['GeographyItemId'])] = true;
		}
		return array_keys($ids);
	}

	private function ListAvailableVariables($level): array
	{
		$variables = [];
		foreach ($level->Variables as $variable)
		{
			if (!$variable->IsGap)
				$variables[] = McpCatalogService::DescribeVariable($variable);
		}
		return $variables;
	}

	public function GetDatasetRecords(int $indicatorId, int $versionId, int $levelId, array $regionIds, ?int $partition,
		array $columns, int $limit, int $offset): array
	{
		$context = $this->ResolveContext($indicatorId, $versionId, $levelId);
		$level = $context['level'];
		$settings = App::Settings()->Mcp();
		McpListingRules::CheckLevelListable($level->Dataset->Type, intval($level->GeographyId),
			$settings->ListingRestrictedGeographyIds, $context['source']['mapUrl']);
		$this->visibility->RequireRegionsExposed($regionIds);
		$partitionDescription = McpCatalogService::DescribePartition($level->Partitions);
		McpListingRules::CheckPartition($partitionDescription, $partition);

		$regionFilter = null;
		if (count($regionIds) > 0)
			$regionFilter = $regionIds;
		$model = new DatasetDownloadModel('', '', [], [], -1, 'basic');
		$model->PrepareFileQuery($level->Dataset->Id, null, $regionFilter, null, null, $partition, null);
		$totalRows = $model->GetCountRows();
		McpListingRules::CheckVolume(count($regionIds) > 0, $totalRows, $settings->MaxListableRows);

		$allColumns = $model->GetCols();
		$selection = $this->SelectColumns($allColumns, $columns, $settings->MaxDefaultColumns);
		$labels = [];
		$rows = [];
		if (!$selection['dictionaryOnly'])
		{
			$labels = $this->LoadLabels($model, $allColumns, $selection['positions']);
			$rows = $this->BuildRecordRows($model->GetPagedRows($offset, $limit), $allColumns, $selection['positions'], $labels);
		}
		return [
			'source' => $this->WithMapLink($context, $regionIds, $partition),
			'level' => $context['levelInfo'],
			'regions' => $this->visibility->DescribeRegions($regionIds),
			'partition' => $this->DescribeSelectedPartition($partitionDescription, $partition),
			'totalRows' => $totalRows,
			'offset' => $offset,
			'notes' => $selection['notes'],
			'columns' => $this->DescribeRecordColumns($allColumns, $selection['positions'], $labels),
			'rows' => $rows,
			'dictionaryOnly' => $selection['dictionaryOnly']
		];
	}

	/**
	 * Posiciones de las columnas a devolver. Sin columns y con demasiadas columnas, solo se entrega el
	 * diccionario para que se elijan.
	 */
	private function SelectColumns(array $allColumns, array $requested, int $maxDefaultColumns): array
	{
		if (count($requested) > 0)
			return ['positions' => $this->FindColumnPositions($allColumns, $requested), 'dictionaryOnly' => false, 'notes' => []];
		$positions = array_keys($allColumns);
		if (count($allColumns) > $maxDefaultColumns)
			return ['positions' => $positions, 'dictionaryOnly' => true,
				'notes' => ['El nivel tiene ' . count($allColumns) . ' columnas (más de ' . $maxDefaultColumns
					. '). Elegir las que se necesitan con el parámetro columns y repetir la consulta.']];
		return ['positions' => $positions, 'dictionaryOnly' => false, 'notes' => []];
	}

	private function FindColumnPositions(array $allColumns, array $requested): array
	{
		$positionsByName = [];
		foreach ($allColumns as $position => $column)
		{
			$positionsByName[strtolower($column['variable'])] = $position;
		}
		$positions = [];
		foreach ($requested as $name)
		{
			$key = strtolower($name);
			if (!array_key_exists($key, $positionsByName))
				throw new McpToolException("La columna '" . $name . "' no existe. Columnas válidas: "
					. implode(', ', array_column($allColumns, 'variable')) . '.');
			$positions[] = $positionsByName[$key];
		}
		return array_values(array_unique($positions));
	}

	private function LoadLabels(DatasetDownloadModel $model, array $allColumns, array $positions): array
	{
		$labels = [];
		foreach ($positions as $position)
		{
			$labels[$position] = [];
			if ($allColumns[$position]['id'] !== null)
				$labels[$position] = $model->GetColumnLabels($allColumns[$position]['id']);
		}
		return $labels;
	}

	private function BuildRecordRows(array $records, array $allColumns, array $positions, array $labels): array
	{
		$rows = [];
		foreach ($records as $record)
		{
			$cells = [];
			foreach ($positions as $position)
			{
				$cells[] = $this->FormatRecordCell($record[$position], $allColumns[$position], $labels[$position]);
			}
			$rows[] = $cells;
		}
		return $rows;
	}

	private function FormatRecordCell($value, array $column, array $labels): string
	{
		if ($value === null)
			return '';
		$labelKey = '_' . $value;
		if (array_key_exists($labelKey, $labels))
			return strval($labels[$labelKey]);
		if (!self::IsNumericFormat($column['format']))
			return strval($value);
		$decimals = $column['decimals'];
		if ($decimals === null)
			$decimals = self::DEFAULT_RECORD_DECIMALS;
		return McpValues::FormatNumber($value, intval($decimals));
	}

	private function DescribeRecordColumns(array $allColumns, array $positions, array $labels): array
	{
		$described = [];
		foreach ($positions as $position)
		{
			$column = $allColumns[$position];
			$columnLabels = [];
			if (array_key_exists($position, $labels))
				$columnLabels = $labels[$position];
			$described[] = ['name' => $column['variable'], 'description' => strval($column['caption']),
				'type' => self::ColumnTypeName($column['format']), 'detail' => $this->DescribeLabels($columnLabels)];
		}
		return $described;
	}

	private function DescribeLabels(array $labels): string
	{
		if (count($labels) === 0)
			return '';
		$captions = array_slice(array_values($labels), 0, self::LABELS_IN_DICTIONARY);
		$detail = 'Se muestran etiquetas: ' . implode('; ', $captions);
		if (count($labels) > self::LABELS_IN_DICTIONARY)
			$detail .= '; … (' . count($labels) . ' en total)';
		return $detail;
	}

	private static function IsNumericFormat($format): bool
	{
		return in_array(intval($format), [Format::F, Format::COMMA, Format::DOLLAR, Format::E, Format::N, Format::Z], true);
	}

	private static function ColumnTypeName($format): string
	{
		if (self::IsNumericFormat($format))
			return 'número';
		if (in_array(intval($format), [Format::DATE, Format::ADATE, Format::JDATE, Format::DATETIME, Format::DTIME, Format::TIME], true))
			return 'fecha';
		return 'texto';
	}

	private function DescribeSelectedPartition(?array $partition, ?int $given): ?array
	{
		if ($partition === null)
			return null;
		$caption = $partition['allCaption'];
		foreach ($partition['values'] as $item)
		{
			if ($given !== null && $item['value'] === strval($given))
				$caption = $item['caption'];
		}
		if ($caption === null || $caption === '')
			$caption = 'Todos';
		return ['name' => $partition['name'], 'caption' => $caption];
	}

	/**
	 * Valida que el indicador, la serie y el nivel se expongan y arma los datos de origen de la respuesta.
	 */
	private function ResolveContext(int $indicatorId, int $versionId, int $levelId): array
	{
		$indicator = $this->visibility->GetIndicator($indicatorId);
		if ($indicator === null)
			throw new McpToolException('El indicador ' . $indicatorId . ' no existe o no es público. Consultar get_catalog.');
		if (!in_array($versionId, array_column($indicator['versions'], 'id'), true))
			throw new McpToolException('La serie ' . $versionId . ' no pertenece al indicador ' . $indicatorId
				. ' o no es pública. Consultar describe_indicator.');
		$selected = (new SelectedMetricService())->GetSelectedMetric($indicatorId, false);
		if ($selected === null)
			throw new McpToolException('El indicador ' . $indicatorId . ' no tiene información publicada.');
		$versionPosition = $this->FindVersionPosition($selected, $versionId);
		$selectedVersion = array_values($selected->Versions)[$versionPosition];
		$levelPosition = $this->FindLevelPosition($selectedVersion, $levelId);
		$level = array_values($selectedVersion->Levels)[$levelPosition];
		$workId = intval($selectedVersion->Version->WorkId);
		$pinLevel = count($selectedVersion->Levels) > 1;
		$metricRoute = McpMapRoute::BuildMetric($indicatorId, $versionPosition, $levelPosition, null, $pinLevel);
		return [
			'level' => $level,
			'mapTarget' => ['versionPosition' => $versionPosition, 'levelPosition' => $levelPosition, 'pinLevel' => $pinLevel],
			'levelInfo' => ['id' => $levelId, 'name' => $level->Name, 'type' => $level->Dataset->Type],
			'source' => [
				'indicatorId' => $indicatorId,
				'indicator' => $indicator['name'],
				'versionId' => $versionId,
				'version' => $selectedVersion->Version->Name,
				'workId' => $workId,
				'work' => $selectedVersion->Version->Work,
				'metadataUrl' => McpLinks::WorkMetadata($workId),
				'mapUrl' => McpLinks::WorkMap($workId, $metricRoute)
			]
		];
	}

	private function FindVersionPosition($selected, int $versionId): int
	{
		$position = 0;
		foreach ($selected->Versions as $selectedVersion)
		{
			if (intval($selectedVersion->Version->Id) === $versionId)
				return $position;
			$position++;
		}
		throw new McpToolException('La serie ' . $versionId . ' no tiene información publicada.');
	}

	private function FindLevelPosition($selectedVersion, int $levelId): int
	{
		$position = 0;
		foreach ($selectedVersion->Levels as $level)
		{
			if (intval($level->Id) === $levelId)
				return $position;
			$position++;
		}
		throw new McpToolException('El nivel ' . $levelId . ' no existe en la serie. Consultar describe_indicator.');
	}
}
