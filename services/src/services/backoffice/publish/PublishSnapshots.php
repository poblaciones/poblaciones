<?php

namespace helena\services\backoffice\publish;

use minga\framework\Profiling;
use minga\framework\Arr;

use helena\db\admin\WorkModel;
use helena\services\common\BaseService;
use helena\services\backoffice\publish\snapshots\SnapshotMetricVersionModel;

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

		$snapshotsManager = new SnapshotsManager();

		$workModel = new WorkModel();
		$metricVersions = $workModel->GetMetricVersions($workId);

		// Los datos cambian por metricVersion; los metadatos sólo por metric.
		if (sizeof($metricVersions) === 0)
		{
			$snapshotsManager->DeleteMetricVersionsByWork($workId);
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
			}			
			// Actualiza los metadatos del metric en el que están las versiones
			$snapshotsManager->UpdateMetricMetadata($metricVersion['mvr_metric_id']);
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

	public function UpdateWorkVisiblity($workId)
	{
		// Es llamado cuando cambia el isIndexed, el isPrivate o el workType de una cartografía.

		// 1. Trae los metrics ya publicados
		$workModel = new WorkModel(false);
		$workIdShardified = PublishDataTables::Shardified($workId);
		$metricVersions = $workModel->GetMetricVersions($workIdShardified);

		$unshardifiedMetricVersions = PublishDataTables::UnshardifyList($metricVersions, array('mvr_id', 'mvr_metric_id'));

		// 2. Los resetea
		$snapshots = new SnapshotsManager();
		$cache = new CacheManager();
		foreach(Arr::UniqueByField('mvr_metric_id', $unshardifiedMetricVersions) as $metric)
		{
			$snapshots->UpdateMetricMetadata($metric['mvr_metric_id']);
			$cache->ClearSelectedMetricMetadata($metric['mvr_metric_id']);
		}
		$cache->CleanFabMetricsCache();
	}
}

