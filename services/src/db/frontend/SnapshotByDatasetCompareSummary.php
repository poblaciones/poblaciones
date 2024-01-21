<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;
use helena\services\backoffice\publish\snapshots\MergeSnapshotsByDatasetModel;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;

class SnapshotByDatasetCompareSummary extends BaseSpatialSnapshotModel
{
	private $variablePairs;
	private $urbanity;
	private $partition;

	public function __construct($snapshotTable, $datasetType, $variablePairs, $urbanity, $partition)
	{
		$this->variablePairs = $variablePairs;
		$this->urbanity = $urbanity;
		$this->partition = $partition;

		parent::__construct($snapshotTable, "sna", $datasetType);
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();
		if (sizeof($this->variablePairs))
		{
			$sql = "";
			$paramsTotal = [];

			foreach($this->variablePairs as $variablePair)
			{
				$variable = $variablePair[0];
				$variableCompare = $variablePair[1];
				$select = "COUNT(*) Areas, " . $variable->attributes['mvv_id'] . " VariableId, Round(SUM(IFNULL(sna_area_m2, 0)) / 1000000, 6) Km2";

				$varId = "sna_" . $variable->attributes['mvv_id'];
				$varIdCompare = "sna_" . $variableCompare->attributes['mvv_id'];


				$select .= ", SUM(IFNULL(" . $varId . "_value, 0)) Value,
											SUM(" . $varId . "_total) Total,
											SUM(IFNULL(" . $varIdCompare . "_value, 0)) ValueCompare,
												SUM(" . $varIdCompare . "_total) TotalCompare," .
											$varId . "_" . $variableCompare->attributes['mvv_id'] . "_value_label_id ValueId";

				$groupBy = $varId . "_" . $variableCompare->attributes['mvv_id'] . "_value_label_id";

				$from = $this->tableName;

				$where = $this->spatialConditions->UrbanityCondition($this->urbanity);

				$where = $this->AddPartitionCondition($where, $this->partition);

				// Excluye las filas filtradas
				$where = $this->AddNotNullCondition($where, $varId . "_total");
				$where = $this->AddNotNullCondition($where, $varIdCompare . "_total");

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

	public function CheckTableExists($datasetId, $datasetCompareId)
	{
		if (App::Db()->tableExists($this->tableName))
			return;
		// La crea
		Profiling::BeginTimer();
		$c = new MergeSnapshotsByDatasetModel();
		$c->MergeSnapshots($datasetId, $datasetCompareId);
		Profiling::EndTimer();
	}
}


