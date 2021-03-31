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
	private $boundaryId;

	public function __construct($boundaryId)
	{
		$this->boundaryId = $boundaryId;
		parent::__construct('snapshot_boundary_item', 'biw', 'B');
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "count(*) AS itemCount";

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


