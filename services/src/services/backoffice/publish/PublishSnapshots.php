<?php

namespace helena\services\backoffice\publish;

use helena\services\common\BaseService;
use helena\db\admin\WorkModel;
use helena\classes\App;
use minga\framework\ErrorException;

use minga\framework\Profiling;
use minga\framework\Arr;

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
			Profiling::EndTimer();
			return true;
		}
		$metricVersion = $metricVersions[$slice];

		// Actualiza los metric
		if ($work['wrk_metric_data_changed'] || $work['wrk_dataset_data_changed'] || $work['wrk_metric_labels_changed'])
		{
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
}

