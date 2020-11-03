<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotByDatasetSummary extends BaseModel
{
	private $spatialConditions;

	public function __construct($snapshortTable)
	{
		$this->tableName = $snapshortTable;
		$this->idField = 'sna_id';
		$this->captionField = '';
		$this->spatialConditions = new SpatialConditions('sna');
	}

	public function GetMetricVersionSummaryByRegionIds($variables, $hasSummary, $geographyId, $urbanity, $clippingRegionIds, $circle, $datasetType)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionIds, $geographyId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);
		else
			$circleQuery = null;

		return $this->ExecSummaryQuery($variables, $hasSummary, $geographyId, $urbanity, $query, $circleQuery);
	}

	public function GetMetricVersionSummaryByEnvelope($variables, $hasSummary, $geographyId, $urbanity, $envelope)
	{
		$query = $this->spatialConditions->CreateEnvelopeQuery($envelope);

		return $this->ExecSummaryQuery($variables, $hasSummary, $geographyId, $urbanity,$query);
	}

	public function GetMetricVersionSummaryByCircle($variables, $hasSummary, $geographyId, $urbanity, $circle, $datasetType)
	{
		$query =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType, $geographyId);

		return $this->ExecSummaryQuery($variables, $hasSummary, $geographyId, $urbanity, $query);
	}

	private function ExecSummaryQuery($variables, $hasSummary, $geographyId, $urbanity, $query, $extraQuery = null)
	{
		Profiling::BeginTimer();
		if (sizeof($variables))
		{
			$sql = "";
			$paramsTotal = [];

			foreach($variables as $variable)
			{
				$select = "COUNT(*) Areas, " . $variable->Id . " VariableId, Round(SUM(IFNULL(sna_area_m2, 0)) / 1000000, 6) Km2";

				$varId = "sna_" . $variable->Id;

				$select .= ", SUM(IFNULL(" . $varId . "_value, 0)) Value,
											SUM(IFNULL(" . $varId . "_total, 0)) Total," .
											$varId . "_value_label_id ValueId";

				$groupBy = $varId . "_value_label_id";

				$from = $this->tableName;

				$where = $this->spatialConditions->UrbanityCondition($urbanity);

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


