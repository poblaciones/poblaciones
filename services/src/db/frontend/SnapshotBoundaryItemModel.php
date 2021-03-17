<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;

class SnapshotBoundaryItemModel extends BaseModel
{
	private const TILE_SIZE = 256;

	public function __construct()
	{
		$this->tableName = 'snapshot_boundary_item';
		$this->idField = 'biw_id';
	}
	public function GetBoundaryByEnvelope($boundaryId, $envelope, $zoom)
	{
		Profiling::BeginTimer();

		// $rZoom = SpatialConditions::ResolveRZoom($zoom);

		$centroids = ', ST_Y(biw_centroid) as Lat, ST_X(biw_centroid) as Lon';

		// Calcula filtro de 1 pixel para filtrar
		$field = "biw_geometry_r" . 1;
		$filterSize = " AND " . $this->GetSquareFilter($envelope, $field, 1);

		$sql = "SELECT  " . $field . " as value, biw_caption Caption, biw_clipping_region_item_id as FID" . $centroids .
			" FROM snapshot_boundary_item WHERE biw_boundary_id = ? " .
			" AND (MBRIntersects(" . $field . ", ST_PolygonFromText('" . $envelope->ToWKT() . "'))
						)" . $filterSize;
		$params = array($boundaryId);
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

	public function GetSelectedBoundary($id)
	{
		Profiling::BeginTimer();
		$sql = "SELECT boundary.*, metadata.*, ins_caption, ins_watermark_id, ins_color,
						(SELECT COUNT(*) FROM snapshot_boundary_item WHERE biw_boundary_id = bou_id) AS item_count
          FROM boundary
					LEFT JOIN metadata ON met_id = IFNULL(bou_metadata_id,
    (select max(clr_metadata_id) FROM clipping_region JOIN
    boundary_clipping_region ON bcr_boundary_id = ?))
					LEFT JOIN institution ON met_institution_id = ins_id
					WHERE bou_id = ?";
		$ret = App::Db()->fetchAssoc($sql, array($id, $id));

		Profiling::EndTimer();
		return $ret;
	}
}
