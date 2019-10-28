<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;

class SnapshotGeographyItemModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'snapshot_geography_item';
		$this->idField = 'giw_id';
	}
	public function GetGeographyByEnvelope($geographyId, $envelope, $zoom, $getCentroids)
	{
		Profiling::BeginTimer();
		$rZoom = (int) (($zoom + 2) / 3);
		if ($zoom > 10 || $rZoom > 5) $rZoom = 5;
		if ($zoom >= 18) $rZoom = 6;
		if ($zoom < 1) $rZoom = 1;
		$centroids = ($getCentroids ? ', Y(giw_centroid) as Lat, X(giw_centroid) as Lon' : '');

	//	if ($rZoom === 6)
	//		$field = "(select gei_geometry from geography_item WHERE gei_id = giw_geography_item_id)";
	//else

		// Calcula un 1/256 de ancho y alto
		$width = ($envelope->Max->Lon - $envelope->Min->Lon) / 300;
		$height = ($envelope->Max->Lat - $envelope->Min->Lat) / 300;
		$field = "giw_geometry_r" . $rZoom;

		$filterSize = " AND geometryIsMinSize(" . $field .
											"," . $width . "," . $height . ") ";

		$sql = "SELECT  " . $field . " as value, giw_geography_item_id as FID" . $centroids .
			" FROM snapshot_geography_item WHERE giw_geography_id = ? " .
			" AND (MBRIntersects(" . $field . ", PolygonFromText('" . $envelope->ToWKT() . "'))
						)" . $filterSize .
			" ORDER BY giw_geography_item_id";
		$params = array($geographyId);
		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
}
