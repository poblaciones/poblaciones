<?php

namespace helena\services\backoffice\publish;

use minga\framework\Profiling;
use minga\framework\Arr;
use minga\framework\Context;

use helena\classes\App;
use helena\db\backoffice\WorkModel;
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

		$totalSlices = sizeof($datasets);
		if ($slice < $totalSlices)
		{
			$row = $datasets[$slice];
			// Actualiza lookup y shapes
			if ($work['wrk_dataset_data_changed'])
			{
				$cacheManager->ClearDatasetData($row['dat_id']);
				$workIsIndexed = $work['wrk_is_indexed'];
				$snapshotsManager->UpdateDatasetData($row, $workIsIndexed);
				if ($workIsIndexed)
				{
					$cacheManager->CleanLabelsCache();
					VersionUpdater::Increment('LOOKUP_REGIONS');
				}
			}
			// Actualiza métricas
			if ($work['wrk_metric_data_changed'] || $work['wrk_dataset_data_changed']
						|| $work['wrk_metric_labels_changed'])
			{
				$cacheManager->ClearDatasetData($row['dat_id']);
				$snapshotsManager->UpdateDatasetMetrics($row);
			}
		}

		Profiling::EndTimer();

		return $slice == $totalSlices;
	}

	public function UpdateWorkMetricVersions($workId)
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
			return;
		}
		// Actualiza los metric
		if ($work['wrk_metric_data_changed'] || $work['wrk_dataset_data_changed'] || $work['wrk_metric_labels_changed'])
		{
			// Se asegura de dejar limpio
			$snapshotsManager->DeleteMetricVersionsByWork($workId);
			$this->ClearRemovedMetrics($workId, $metricVersions);
		}
		foreach($metricVersions as $metricVersion)
		{
			// Actualiza los metric
			if ($work['wrk_metric_data_changed'] || $work['wrk_dataset_data_changed'] || $work['wrk_metric_labels_changed'])
			{
				// Libera los metadatos del metric (summary, selected, getTile)
				$cacheManager->ClearMetricMetadata($metricVersion['mvr_metric_id']);
			}
			// Actualiza los metadatos del metric en el que están las versiones
			$snapshotsManager->UpdateMetricMetadata($metricVersion['mvr_metric_id']);
		}
		if ($work['wrk_type'] === 'P')
		{
			VersionUpdater::Increment('FAB_METRICS');
			$cacheManager->CleanFabMetricsCache();
		}

		Profiling::EndTimer();
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
		$workIdShardified = PublishDataTables::Shardified($workId);

		// Los actualiza desde drafts
		$update = "UPDATE metric_version_level m JOIN dataset ON
				dat_id = m.mvl_dataset_id SET mvl_extents =
		(SELECT d.mvl_extents FROM draft_metric_version_level d WHERE m.mvl_id = "
			. PublishDataTables::ShardifiedDb("d.mvl_id") . ")  WHERE dat_work_id = ?";
		App::Db()->exec($update, array($workIdShardified));

		// Calcula el del work
		$sql = "UPDATE metadata
						JOIN work ON wrk_metadata_id = met_id
						SET met_extents = (SELECT
														ST_Envelope(LineString(
										POINT(Min(ST_X(PointN(ExteriorRing(mvl_extents), 1))),
										MIN(ST_Y(PointN(ExteriorRing(mvl_extents), 1)))),
										POINT(Max(ST_X(PointN(ExteriorRing(mvl_extents), 3))),
										MAX(ST_Y(PointN(ExteriorRing(mvl_extents), 3))))))
										FROM dataset, metric_version_level
										WHERE dat_id = mvl_dataset_id and dat_work_id = ?)
						WHERE wrk_id = ?";
		App::Db()->exec($sql, array($workIdShardified, $workIdShardified));

		Profiling::EndTimer();
	}
}

