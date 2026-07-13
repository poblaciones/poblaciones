<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotBoundarySummary extends BaseSpatialSnapshotModel
{
	private $boundaryVersonId;

	public function __construct($boundaryVersonId)
	{
		$this->boundaryVersonId = $boundaryVersonId;
		parent::__construct('snapshot_boundary_version_item', 'biw', 'B');
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "COUNT(*) AS Value, biw_boundary_version_id AS BoundaryVersionId, biw_clipping_region_id AS ValueId, SUM(biw_area_m2) / 1000 / 1000 AS Km2";

		$from = $this->tableName;

		// Pone filtros
		$where = "biw_boundary_version_id = ?";
		$params = array($this->boundaryVersonId);

		$groupBy = "biw_boundary_version_id, biw_clipping_region_id";

		$baseQuery = new QueryPart($from, $where, $params, $select, $groupBy);

		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);
		$ret = $multiQuery->fetchAll();

		Profiling::EndTimer();

		return $ret;
	}
}


