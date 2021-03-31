<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotByDatasetSummary extends BaseSpatialSnapshotModel
{
	private $variables;
	private $urbanity;

	public function __construct($snapshotTable, $datasetType, $variables, $urbanity)
	{
		$this->variables = $variables;
		$this->urbanity = $urbanity;

		parent::__construct($snapshotTable, "sna", $datasetType);
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();
		if (sizeof($this->variables))
		{
			$sql = "";
			$paramsTotal = [];

			foreach($this->variables as $variable)
			{
				$select = "COUNT(*) Areas, " . $variable->Id . " VariableId, Round(SUM(IFNULL(sna_area_m2, 0)) / 1000000, 6) Km2";

				$varId = "sna_" . $variable->Id;

				$select .= ", SUM(IFNULL(" . $varId . "_value, 0)) Value,
											SUM(IFNULL(" . $varId . "_total, 0)) Total," .
											$varId . "_value_label_id ValueId";

				$groupBy = $varId . "_value_label_id";

				$from = $this->tableName;

				$where = $this->spatialConditions->UrbanityCondition($this->urbanity);

				$baseQuery = new QueryPart($from, $where, null, $select, $groupBy);

				if ($query)
					$query->Select = '';

				if ($extraQuery)
					$extraQuery->Select = '';

				$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);

				if ($sql !== '') $sql .= ' UNION ';

				$sql .= $multiQuery->sql;
				if ($multiQuery->params)
					$paramsTotal = array_merge($paramsTotal, $multiQuery->params);
			}
			$ret = App::Db()->fetchAll($sql, $paramsTotal);
		}
		else
			$ret = [];

		Profiling::EndTimer();
		return $ret;
	}
}


