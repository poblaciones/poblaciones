<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\services\backoffice\publish\PublishDataTables;

use minga\framework\Profiling;
use minga\framework\Context;
use helena\classes\Account;
use helena\classes\App;

class SnapshotShapeDatasetItemModel
{
	public function RegenDataset($datasetId)
	{
	 	Profiling::BeginTimer();

		$datasetIdShardified = PublishDataTables::Shardified($datasetId);
		$datasetTable = App::Db()->fetchScalar("SELECT dat_table FROM dataset WHERE dat_id = ?", array($datasetIdShardified));

		$sql = "INSERT INTO snapshot_shape_dataset_item(sdi_dataset_id, sdi_dataset_item_id, sdi_feature_id, sdi_geometry, sdi_centroid)
						SELECT " . $datasetIdShardified . ", id, 0x100000000 * " .  $datasetIdShardified . " + id, geometry, ST_CENTROID(geometry_r6) from " . $datasetTable;

		App::Db()->exec($sql);

		Profiling::EndTimer();
	}

	public function Clear($datasetId)
	{
		Profiling::BeginTimer();

		$datasetIdShardified = PublishDataTables::Shardified($datasetId);
		$params = array($datasetIdShardified);

		$sql = "DELETE FROM snapshot_shape_dataset_item WHERE sdi_dataset_id = ?";
		App::Db()->exec($sql, $params);

		Profiling::EndTimer();
	}
}
