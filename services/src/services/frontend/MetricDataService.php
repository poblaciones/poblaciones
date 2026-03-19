<?php

namespace helena\services\frontend;

use minga\framework\Performance;
use minga\framework\Profiling;

use helena\entities\frontend\clipping\FeaturesInfo;
use helena\classes\App;
use helena\classes\GlobalTimer;

use helena\caches\TileDataCache;
use helena\caches\MetricDataCache;
use helena\services\common\BaseService;

use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\services\backoffice\publish\snapshots\MergeSnapshotsByDatasetModel;

use helena\db\frontend\SnapshotByDatasetTileData;
use helena\db\frontend\SnapshotByDatasetCompareTileData;
use helena\entities\frontend\clipping\TileDataInfo;
use helena\entities\frontend\geometries\Envelope;


class MetricDataService extends BaseService
{

	public function GetMetricData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $partition)
	{
		Profiling::BeginTimer();
		$data = null;
		$this->CheckNotNullNumeric($metricId);
		$this->CheckNotNullNumeric($metricVersionId);
		$this->CheckNotNumericNullable($levelId);

		$data = $this->CalculateLayerData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $partition);

		Profiling::EndTimer();
		return $data;
	}

	private function CalculateLayerData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $partition)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId);
		$version = $metric->GetVersion($metricVersionId);
		$level = $version->GetLevel($levelId);

		$snapshotTable = SnapshotByDatasetModel::SnapshotTable($level->Dataset->Table);

		$frame->TileEnvelope = "full";

		$hasDescriptions = $level->HasDescriptions;
		$hasSymbols = $level->Dataset->Marker && $level->Dataset->Marker->Type !== 'N' &&  $level->Dataset->Marker->Source === 'V';
		$requiresPolygons = ($level->Dataset->Type == 'S');

		$table = new SnapshotByDatasetTileData($snapshotTable,
											$level->Dataset->Id, $level->Dataset->Type, $level->Dataset->AreSegments, $level->Variables,
													$urbanity, $partition, $hasSymbols, $hasDescriptions, $requiresPolygons);

		$table->honorTileLimit = false;

		$rows = $table->GetRows($frame);

		if ($level->Dataset->AreSegments)
			$data = TileDataService::CreateTileDataInfoWithGeometries($rows, $frame);
		else
			$data = TileDataService::CreateTileDataInfo($rows);

		return $data;
	}

}

