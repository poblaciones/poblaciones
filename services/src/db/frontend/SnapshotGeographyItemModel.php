<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;

class SnapshotGeographyItemModel extends BaseModel
{
	private const TILE_SIZE = 256;

	public function __construct()
	{
		$this->tableName = 'snapshot_geography_item';
		$this->idField = 'giw_id';
	}
	public function GetGeographyByEnvelope($geographyId, $envelope, $zoom, $getCentroids)
	{
		Profiling::BeginTimer();

		$rZoom = SpatialConditions::ResolveRZoom($zoom);

		$centroids = ($getCentroids ? ', ST_Y(giw_centroid) as Lat, ST_X(giw_centroid) as Lon' : '');

		// Calcula filtro de 1 pixel para filtrar
		$field = "giw_geometry_r" . $rZoom;
		$filterSize = " AND " . $this->GetSquareFilter($envelope, $field, 1);
		// Calcula los que representan algo menor a 8 pixels x 8 pixels
		// o densidad de población mayor a 10 personas por hectárea (m2 * 100 * 100 > 10)
		$denseAttribute = "NOT " . $this->GetSquareFilter($envelope, $field, 8) .
											" OR giw_population / giw_area_m2 > 0.001"; // 1000 x km2

		$sql = "SELECT  " . $field . " as value, " . $denseAttribute . " dense, giw_geography_item_id as FID" . $centroids .
			" FROM snapshot_geography_item WHERE giw_geography_id = ? " .
			" AND (MBRIntersects(" . $field . ", ST_PolygonFromText('" . $envelope->ToWKT() . "'))
						)" . $filterSize .
			" ORDER BY giw_geography_item_id";
		$params = array($geographyId);
		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	private function GetSquareFilter($envelope, $field, $pixels)
	{
		$ratio = self::TILE_SIZE / $pixels;
		$width = ($envelope->Max->Lon - $envelope->Min->Lon) / $ratio;
		$height = ($envelope->Max->Lat - $envelope->Min->Lat) / $ratio;
		return " geometryIsMinSize(" . $field .
											"," . $width . "," . $height . ") ";
	}
}
