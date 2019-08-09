<?php

namespace helena\services\backoffice\publish;

use minga\framework\Arr;
use minga\framework\Profiling;

use helena\services\common\BaseService;
use helena\db\admin\WorkModel;
use helena\classes\DatasetTypeEnum;

use helena\services\backoffice\publish\snapshots\SnapshotMetricVersionModel;
use helena\services\backoffice\publish\snapshots\SnapshotMetricModel;
use helena\services\backoffice\publish\snapshots\SnapshotShapeDatasetItemModel;
use helena\services\backoffice\publish\snapshots\SnapshotMetricVersionItemVariableModel;
use helena\services\backoffice\publish\snapshots\SnapshotLookupModel;

class SnapshotsManager extends BaseService
{
	public function DeleteMetricVersionMetadata($metricVersionId, $metricId)
	{
		$modelVersion = new SnapshotMetricVersionModel();
		$modelVersion->ClearMetricVersion($metricVersionId);

		$model = new SnapshotMetricModel();
		$model->ClearMetric($metricId);
		$model->RegenMetric($metricId);
	}

	// Metric
	public function UpdateMetricMetadata($metricId)
	{
		$this->CleanMetricMetadata($metricId);
		// Regen
		$modelVersion = new SnapshotMetricVersionModel();
		$modelVersion->RegenMetric($metricId);
		$model = new SnapshotMetricModel();
		$model->RegenMetric($metricId);
	}

	public function CleanMetricMetadata($metricId)
	{
		$model = new SnapshotMetricModel();
		$model->ClearMetric($metricId);
		$modelVersion = new SnapshotMetricVersionModel();
		$modelVersion->ClearMetric($metricId);
	}

	// MetricVersion
	public function UpdateMetricVersionData($metricVersion)
	{
		Profiling::BeginTimer();

		$this->CleanMetricVersionData($metricVersion);

		$model = new SnapshotMetricVersionItemVariableModel();
		$model->RegenMetricVersion($metricVersion['mvr_id']);

		Profiling::EndTimer();
	}

	public function CleanMetricVersionData($metricVersion)
	{
		Profiling::BeginTimer();

		$model = new SnapshotMetricVersionItemVariableModel();
		$model->ClearMetricVersion($metricVersion['mvr_id']);

		Profiling::EndTimer();
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

	public function UpdateDatasetData($row)
	{
		Profiling::BeginTimer();
		if ($row["dat_type"] == DatasetTypeEnum::Shapes)
		{
			$this->CleanDataset($row['dat_id']);
			$mode = new SnapshotShapeDatasetItemModel();
			$mode->RegenDataset($row['dat_id']);
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