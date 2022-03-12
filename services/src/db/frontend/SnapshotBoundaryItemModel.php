<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use minga\framework\ErrorException;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotBoundaryItemModel extends BaseSpatialSnapshotModel
{
	private $boundaryId;
	public $zoom = null;

	public function __construct($boundaryId)
	{
		$this->boundaryId = $boundaryId;
		parent::__construct('snapshot_boundary_item', 'biw', 'B');
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();
		$centroids = ', ST_Y(biw_centroid) as Lat, ST_X(biw_centroid) as Lon';

		if ($this->zoom === null)
			throw new ErrorException("Zoom must be set before calling execQuery");

		$rZoom = SpatialConditions::ResolveRZoom3($this->zoom);
		$field = "biw_geometry_r" . $rZoom;

		$select = $field . " as value, biw_caption Caption, biw_clipping_region_item_id as FID" . $centroids;

		$from = $this->tableName;

		// Pone filtros
		$where = "biw_boundary_id = ?";
		$params = array($this->boundaryId);

		$baseQuery = new QueryPart($from, $where, $params, $select);

		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);
		$ret = $multiQuery->fetchAll();

		Profiling::EndTimer();

		return $ret;
	}
}


