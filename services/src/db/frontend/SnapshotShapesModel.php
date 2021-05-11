<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use helena\classes\App;

class SnapshotShapesModel extends BaseModel
{
	public $tableName;

	public function __construct()
	{
		$this->tableName = 'undefined';
		$this->idField = 'id';
	}
	public function GetShapesByEnvelope($datasetId, $envelope)
	{
		Profiling::BeginTimer();

		$sql = "SELECT sdi_geometry as value, sdi_feature_id as FID " .
			" FROM snapshot_shape_dataset_item WHERE " .
			" ST_Intersects(sdi_geometry, ST_PolygonFromText('" . $envelope->ToWKT() . "'))" .
			" AND sdi_dataset_id = ?
			 ORDER BY sdi_dataset_item_id";

	//	$params = array();
		$params = array($datasetId);

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
}
