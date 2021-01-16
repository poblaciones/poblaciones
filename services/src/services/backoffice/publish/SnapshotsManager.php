<?php

namespace helena\services\backoffice\publish;

use minga\framework\Profiling;
use minga\framework\Context;

use helena\services\common\BaseService;
use helena\classes\DatasetTypeEnum;

use helena\services\backoffice\publish\snapshots\SnapshotMetricVersionModel;
use helena\services\backoffice\publish\snapshots\SnapshotShapeDatasetItemModel;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\services\backoffice\publish\snapshots\SnapshotLookupModel;

class SnapshotsManager extends BaseService
{
	public function DeleteMetricVersionsByWork($workId)
	{
		$modelVersion = new SnapshotMetricVersionModel();
		$modelVersion->ClearByWork($workId);
	}

	// Metric
	public function UpdateMetricMetadata($metricId)
	{
		// Regen
		$modelVersion = new SnapshotMetricVersionModel();
		$modelVersion->IncrementMetricSignature($metricId);
		$modelVersion->ClearMetric($metricId);
		$modelVersion->RegenMetric($metricId);
	}
	public function UpdateAllMetricMetadata()
	{
		// Regen
		$modelVersion = new SnapshotMetricVersionModel();
		$modelVersion->ClearAllMetric();
		$modelVersion->RegenAllMetric();
	}

	// Dataset
	public function CleanDataset($datasetId)
	{
		Profiling::BeginTimer();

		$mode = new SnapshotShapeDatasetItemModel();
		$mode->Clear($datasetId);

		$model = new SnapshotLookupModel();
		$model->ClearDataset($datasetId);

		Profiling::EndTimer();
	}
	public function UpdateDatasetMetrics($row)
	{
		Profiling::BeginTimer();

		$model = new SnapshotByDatasetModel();
		$model->RegenDatasetLevels($row['dat_id']);

		Profiling::EndTimer();
	}
	public function UpdateDatasetData($row)
	{
		Profiling::BeginTimer();

		$this->CleanDataset($row['dat_id']);
		if ($row["dat_type"] == DatasetTypeEnum::Shapes)
		{
			$shapeItems = new SnapshotShapeDatasetItemModel();
			$shapeItems->RegenDataset($row['dat_id']);
		}
		if (($row["dat_type"] == DatasetTypeEnum::Shapes || $row["dat_type"] == DatasetTypeEnum::Locations)
			&& $row["dat_caption_column_id"] !== null)
		{
			$model = new SnapshotLookupModel();
			$model->RegenDataset($row['dat_id']);
		}
		Profiling::EndTimer();
	}
}