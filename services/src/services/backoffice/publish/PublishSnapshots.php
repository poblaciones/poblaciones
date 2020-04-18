<?php

namespace helena\services\backoffice\publish;

use minga\framework\Profiling;
use minga\framework\Arr;

use helena\classes\App;
use helena\db\admin\WorkModel;
use helena\services\common\BaseService;
use helena\classes\VersionUpdater;

class PublishSnapshots extends BaseService
{
	public function UpdateWorkDatasets($workId, $slice, &$totalSlices)
	{
		Profiling::BeginTimer();

		$workModel = new WorkModel();
		$work = $workModel->GetWork($workId);

		$cacheManager = new CacheManager();
		$snapshotsManager = new SnapshotsManager();

		$datasets = $workModel->GetDatasets($workId);

		// Actualiza datos
		$totalSlices = sizeof($datasets);
		if ($slice < $totalSlices)
		{
			$row = $datasets[$slice];
			$cacheManager->ClearDatasetData($row['dat_id']);
			$snapshotsManager->UpdateDatasetData($row);
		}

		Profiling::EndTimer();

		if ($work['wrk_dataset_data_changed'])
		{
			return $slice == $totalSlices;
		}
		else
			return true;
	}

	public function UpdateWorkMetricVersions($workId, $slice, &$totalSlices)
	{
		Profiling::BeginTimer();

		$workModel = new WorkModel();
		$work = $workModel->GetWork($workId);

		$cacheManager = new CacheManager();
		$snapshotsManager = new SnapshotsManager();

		$workModel = new WorkModel();
		$metricVersions = $workModel->GetMetricVersions($workId);

		// Los datos cambian por metricVersion; los metadatos sólo por metric.
		if (sizeof($metricVersions) === 0)
		{
			$snapshotsManager->DeleteMetricVersionsByWork($workId);
			$this->ClearRemovedMetrics($workId, $metricVersions);
			Profiling::EndTimer();
			return true;
		}
		$metricVersion = $metricVersions[$slice];

		// Actualiza los metric
		if ($work['wrk_metric_data_changed'] || $work['wrk_dataset_data_changed'] || $work['wrk_metric_labels_changed'])
		{
			// En el primero se asegura de dejar limpio
			if ($slice === 0)
			{
				$snapshotsManager->DeleteMetricVersionsByWork($workId);
				$this->ClearRemovedMetrics($workId, $metricVersions);
			}
			// Libera los metadatos del metric (summary, selected, getTile)
			$cacheManager->ClearMetricMetadata($metricVersion['mvr_metric_id']);
		}
		// Actualiza los metadatos del metric en el que están las versiones
		$snapshotsManager->UpdateMetricMetadata($metricVersion['mvr_metric_id']);
		if ($work['wrk_type'] === 'P')
		{
			VersionUpdater::Increment('FAB_METRICS');
			$cacheManager->CleanFabMetricsCache();
		}
		// Actualiza los version
		if ($work['wrk_metric_data_changed'] || $work['wrk_dataset_data_changed'])
			$snapshotsManager->UpdateMetricVersionData($metricVersion);

		Profiling::EndTimer();

		if ($work['wrk_metric_data_changed'] || $work['wrk_dataset_data_changed'] || $work['wrk_metric_labels_changed'])
		{
			$totalSlices = sizeof($metricVersions) - 1;
			return $slice == $totalSlices;
		}
		else
			return true;
	}

	private function ClearRemovedMetrics($workId, $metricVersions)
	{
		$cacheManager = new CacheManager();
		$workIdShardified = PublishDataTables::Shardified($workId);
		$publicWorkModel = new WorkModel(false);
		$previousMetricVersions = PublishDataTables::UnshardifyList($publicWorkModel->GetMetricVersions($workIdShardified),
																																				array('mvr_id', 'mvr_metric_id'));
		$removedMetricVersions = Arr::RemoveByField('mvr_id', $previousMetricVersions, $metricVersions);
		foreach($removedMetricVersions as $row)
		{
			$cacheManager->ClearMetricMetadata($row['mvr_metric_id']);
		}
	}

	public function UpdateWorkVisibility($workId)
	{
		// Es llamado cuando cambia el isIndexed, el isPrivate, el accesLink o el workType de una cartografía.
		// 1. Trae los metrics ya publicados
		$publicWorkModel = new WorkModel(false);
		$workIdShardified = PublishDataTables::Shardified($workId);
		$metricVersions = $publicWorkModel->GetMetricVersions($workIdShardified);
		$unshardifiedMetricVersions = PublishDataTables::UnshardifyList($metricVersions, array('mvr_id', 'mvr_metric_id'));
		// 2. Los resetea
		$snapshots = new SnapshotsManager();
		$cache = new CacheManager();
		foreach(Arr::UniqueByField('mvr_metric_id', $unshardifiedMetricVersions) as $metric)
		{
			$snapshots->UpdateMetricMetadata($metric['mvr_metric_id']);
			$cache->ClearSelectedMetricMetadata($metric['mvr_metric_id']);
		}
		VersionUpdater::Increment('FAB_METRICS');
		$cache->CleanFabMetricsCache();
		$cache->CleanWorkVisiblityCache($workId);
	}

	public function UpdateWorkSegmentedCrawling($workId)
	{
		$cache = new CacheManager();
		$cache->CleanWorkHandlesCache($workId);
		$cache->CleanWorkVisiblityCache($workId);
	}
	public function UpdateExtents($workId)
	{
		Profiling::BeginTimer();

		$workModel = new WorkModel();
		$work = $workModel->GetWork($workId);
		if ($work['wrk_metric_data_changed'] || $work['wrk_dataset_data_changed'])
		{
			// Calcula el del work
			$sql = "UPDATE metadata
					JOIN work ON wrk_metadata_id = met_id
					JOIN dataset ON wrk_id = dat_work_id
					SET met_extents =
					 (SELECT
									Envelope(LineString(
					POINT(Min(ST_X(PointN(ExteriorRing(mvl_extents), 1))),
					MIN(ST_Y(PointN(ExteriorRing(mvl_extents), 1)))),
					POINT(Max(ST_X(PointN(ExteriorRing(mvl_extents), 3))),
					MAX(ST_Y(PointN(ExteriorRing(mvl_extents), 3))))))
					FROM  metric_version_level
					WHERE dat_id = mvl_dataset_id)

					WHERE wrk_id = ?";
			$workIdShardified = PublishDataTables::Shardified($workId);
			App::Db()->exec($sql, array($workIdShardified));
		}
		Profiling::EndTimer();
	}
}

