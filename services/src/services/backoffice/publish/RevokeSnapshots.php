<?php

namespace helena\services\backoffice\publish;

use helena\services\common\BaseService;
use helena\db\admin\WorkModel;
use helena\classes\App;
use minga\framework\ErrorException;

use minga\framework\Profiling;
use minga\framework\Arr;

class RevokeSnapshots extends BaseService
{
	public function DeleteWorkDatasets($workId, $deleteAll = false)
	{
		Profiling::BeginTimer();

		$workModel = new WorkModel();
		$work = $workModel->GetWork($workId);
		if ($work == null)
			// es la primera vez que se publica
			return;

		$cacheManager = new CacheManager();
		$snapshotsManager = new SnapshotsManager();
		$datasets = $workModel->GetDatasets($workId);

		$publicWorkModel = new WorkModel(false);
		$shardifiedWorkId = PublishDataTables::Shardified($workId);
		$previousDatasets = PublishDataTables::UnshardifyList($publicWorkModel->GetDatasets($shardifiedWorkId), array('dat_id'));

		// Identifica qué borrar
		if ($deleteAll)
			$removedDatasets = $previousDatasets;
		else
			$removedDatasets = Arr::RemoveByField('dat_id', $previousDatasets, $datasets);
		// Borra
		foreach($removedDatasets as $row)
		{
			$cacheManager->ClearDataset($row['dat_id']);
			$snapshotsManager->CleanDataset($row['dat_id']);
		}
		foreach(Arr::UniqueByField('dat_work_id', $removedDatasets) as $row)
		{
			$cacheManager->CleanMetadataPdfCache($row['dat_work_id']);
		}
		// Si hubo uso de datasets que antes no estaban o sacó alguno, tiene que regenerar
		if (sizeof($removedDatasets) > 0 || sizeof($previousDatasets) != sizeof($datasets))
			$work['wrk_dataset_data_changed'] = true;

		// Actualiza metadatos
		if ($work['wrk_dataset_labels_changed'] || $work['wrk_dataset_data_changed'])
		{
			foreach($datasets as $row)
				$cacheManager->ClearDatasetMetaData($row['dat_id']);

			foreach(Arr::UniqueByField('dat_work_id', $datasets) as $row)
				$cacheManager->CleanMetadataPdfCache($row);
		}

		Profiling::EndTimer();
	}

	public function DeleteWorkMetricVersions($workId, $deleteAll = false)
	{
		Profiling::BeginTimer();

		$workModel = new WorkModel();
		$work = $workModel->GetWork($workId);

		$cacheManager = new CacheManager();
		$snapshotsManager = new SnapshotsManager();

		$workModel = new WorkModel();
		$metricVersions = $workModel->GetMetricVersions($workId);

		$publicWorkModel = new WorkModel(false);
		$shardifiedWorkId = PublishDataTables::Shardified($workId);
		$previousMetricVersions = PublishDataTables::UnshardifyList($publicWorkModel->GetMetricVersions($shardifiedWorkId), array('mvr_id', 'mvr_metric_id'));

		// Limpia el fabCache
		if ($work['wrk_type'] === 'P')
		{
			$cacheManager->CleanFabMetricsCache();
		}

		// Identifica qué borrar
		if ($deleteAll)
			$removedMetricVersions = $previousMetricVersions;
		else
			$removedMetricVersions = Arr::RemoveByField('mvr_id', $previousMetricVersions, $metricVersions);

		// Borra lo removido
		foreach($removedMetricVersions as $row)
		{
			$snapshotsManager->DeleteMetricVersionMetadata($row['mvr_id'], $row['mvr_metric_id']);
		}

		foreach($removedMetricVersions as $row)
		{
			$snapshotsManager->CleanMetricVersionData($row);
		}
		// Libera los metadatos del metric en el que están las versiones y de los borrados
		foreach(Arr::UniqueByField('mvr_metric_id', array_merge($previousMetricVersions, $metricVersions)) as $row)
		{
			$cacheManager->ClearMetricMetadata($row['mvr_metric_id']);
			$cacheManager->ClearSelectedMetricMetadata($row['mvr_metric_id']);
		}
	}
}

