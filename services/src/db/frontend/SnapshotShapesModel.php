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
	public function GetShapesByEnvelope($datasetId, $envelope, $zoom, $getCentroids)
	{
		Profiling::BeginTimer();
		$rZoom = (int) (($zoom + 2) / 3);
		if ($zoom > 10 || $rZoom > 5) $rZoom = 5;

		$centroids = ($getCentroids ? ", ST_Y(centroid) as Lat, ST_X(centroid) as Lon" : '');

		$sql = "SELECT geometry_r" . $rZoom . " as value, " . $datasetId . " * 0x100000000 + id as FID " .
			$centroids .
			" FROM " . $this->tableName . " WHERE " .
			" ST_Intersects(geometry_r1, ST_PolygonFromText('" . $envelope->ToWKT() . "'))" .
			" ORDER BY id";
		$params = array();
	//	$params = array($datasetId);

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
}
