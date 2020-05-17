<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotMetricVersionItemVariableModel_v2 extends BaseModel
{
	const LOCATIONS_LIMIT_PER_TILE = 500;
	private $spatialConditions;

	public function __construct($snapshortTable)
	{
		$this->tableName = $snapshortTable;
		$this->idField = 'sna_id';
		$this->captionField = '';
		$this->spatialConditions = new SpatialConditions('sna');
	}

	public function GetMetricVersionSummaryByRegionId($metricVersionId, $variables, $hasSummary, $geographyId, $urbanity, $clippingRegionId, $circle, $datasetType)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionId, $geographyId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType, $metricVersionId, $geographyId);
		else
			$circleQuery = null;

		return $this->ExecSummaryQuery($metricVersionId, $variables, $hasSummary, $geographyId, $urbanity, $query, $circleQuery);
	}

	public function GetMetricVersionSummaryByEnvelope($metricVersionId, $variables, $hasSummary, $geographyId, $urbanity, $envelope)
	{
		$query = $this->spatialConditions->CreateEnvelopeQuery($envelope, $metricVersionId, $geographyId);

		return $this->ExecSummaryQuery($metricVersionId, $variables, $hasSummary, $geographyId, $urbanity,$query);
	}

	public function GetMetricVersionSummaryByCircle($metricVersionId, $variables, $hasSummary, $geographyId, $urbanity, $circle, $datasetType)
	{
		$query =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType, $metricVersionId, $geographyId);

		return $this->ExecSummaryQuery($metricVersionId, $variables, $hasSummary, $geographyId, $urbanity, $query);
	}

	private function ExecSummaryQuery($metricVersionId, $variables, $hasSummary, $geographyId, $urbanity, $query, $extraQuery = null)
	{
		Profiling::BeginTimer();
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
		Profiling::EndTimer();
		return $ret;
	}

	private function CreateCrossTableQuery($metricVersionId, $hasSummary, $geographyId, $urbanity, $query, $extraQuery = null)
	{
		Profiling::BeginTimer();
		$select = "t1.sna_metric_version_variable_id VariableId, t1.sna_version_value_label_id ValueId, t2.sna_metric_version_variable_id TargetVariableId, t2.sna_version_value_label_id TargetValueId, " .
			"SUM(IFNULL(t1.sna_value, 0)) Value, SUM(IFNULL(t1.sna_total, 0)) Total, Round(SUM(IFNULL(t1.sna_area_m2, 0)) / 1000000, 6) Km2, COUNT(*) Areas ";

		$from = $this->tableName . " t1";
		$join = " JOIN snapshop_geography_item_geography_item snap ON t1.sna_geography_item_id = snap.gii_from_geography_item_id LEFT JOIN " . $this->tableName . " t2 ON t2.sna_geography_item_id = snap.gii_to_geography_item_id";

		$where = "t1.sna_metric_version_id = ? AND t1.sna_geography_id <=> ? " .	$this->spatialConditions->UrbanityCondition($urbanity);
		$params = array($metricVersionId, $geographyId);

		$groupBy = "t1.sna_metric_version_variable_id, t1.sna_version_value_label_id, t2.sna_metric_version_variable_id, t2.sna_version_value_label_id";

		// TODO: falta duplicar los subqueries y crear snapshop_geography_item_geography_item
		$baseQuery = new QueryPart($from, $where, $params, $select, $groupBy);

		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);

		$ret = $multiQuery->fetchAll();
		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetricVersionTileDataByEnvelope($metricVersionId, $variables, $geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions)
	{
		return $this->ExecTileDataQuery($metricVersionId, $variables, $geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions);
	}

	public function GetMetricVersionTileDataByRegionId($metricVersionId, $variables, $geographyId, $urbanity, $envelope, $clippingRegionId, $circle, $datasetType, $hasDescriptions)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionId, $geographyId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);
		else
			$circleQuery = null;

		return $this->ExecTileDataQuery($metricVersionId, $variables, $geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions, $query, $circleQuery);
	}

	public function GetMetricVersionTileDataByCircle($metricVersionId, $variables, $geographyId, $urbanity, $envelope, $circle, $datasetType, $hasDescriptions)
	{
		$query =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType, $metricVersionId, $geographyId);

		return $this->ExecTileDataQuery($metricVersionId, $variables, $geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions, $query);
	}

	private function ExecTileDataQuery($metricVersionId, $variables, $geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions, $query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "sna_feature_id FID";
		foreach($variables as $variable)
		{
			$select .= ", sna_" . $variable->Id . "_value, sna_" . $variable->Id . "_value_label_id,
									sna_" . $variable->Id . "_total";
		}

		$envelopeQuery =  $this->spatialConditions->CreateEnvelopeQuery($envelope, $metricVersionId, $geographyId);
		if ($hasDescriptions)
			$select .= ", sna_description Description";

		if ($datasetType == 'L')
		{
			// Si es un metric de puntos, trae la ubicación del punto
			$select .= ", round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(sna_location), ". GeoJson::PRECISION .")  as Lon";
		}
		$from = $this->tableName;

		$where = $this->spatialConditions->UrbanityCondition($urbanity);

		$baseQuery = new QueryPart($from, $where, null, $select, null, "sna_feature_id");

		$multiQuery = new MultiQuery($baseQuery, $envelopeQuery, $query, $extraQuery);
		//$multiQuery->dump();
		$ret = $multiQuery->fetchAll();

		$extraFields = [];
		if ($hasDescriptions)
			$extraFields[] = 'Description';
		if ($datasetType == 'L')
		{
			// Si es un metric de puntos, trae la ubicación del punto
			$extraFields[] = 'Lat';
			$extraFields[] = 'Lon';
		}
		$ret = self::RotateResults($ret, $datasetType, $variables, $extraFields);

		if ($datasetType == 'L' && sizeof($ret) > self::LOCATIONS_LIMIT_PER_TILE)
		{
			$ret = Arr::SystematicSample($ret, self::LOCATIONS_LIMIT_PER_TILE);
		}
		Profiling::EndTimer();

		return $ret;
	}

	private function RotateResults($arr, $datasetType, $variables, $extraFields)
	{
		$ret = [];
		foreach($arr as $row)
		{
			foreach($variables as $variable)
			{
				$item = [];
				foreach($extraFields as $field)
					$item[$field] = $row[$field];

				$item['FID'] = $row['FID'];

				// Pone lo específico de cada variable
				$item['VariableId'] = $variable->Id;
				$item['Value'] = $row["sna_" . $variable->Id . "_value"];
				$item['Total'] = $row["sna_" . $variable->Id . "_total"];
				$item['ValueId'] = $row["sna_" . $variable->Id . "_value_label_id"];

				$ret[] = $item;
			}
		}
		return $ret;
	}

	public function GetMetricVersionRankingByRegionId($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $clippingRegionId, $circle, $datasetType, $hasDescriptions, $size, $direction)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionId, $geographyId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);
		else
			$circleQuery = null;

		return $this->ExecRankingQuery($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $datasetType, $hasDescriptions, $size, $direction, $query, $circleQuery);
	}

	public function GetMetricVersionRankingByEnvelope($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $envelope, $datasetType, $hasDescriptions, $size, $direction)
	{

		$query = $this->spatialConditions->CreateSimpleEnvelopeQuery($envelope);

		return $this->ExecRankingQuery($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $datasetType, $hasDescriptions, $size, $direction, $query);
	}

	public function GetMetricVersionRankingByCircle($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $circle, $datasetType, $hasDescriptions, $size, $direction)
	{
		$query =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);

		return $this->ExecRankingQuery($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $datasetType, $hasDescriptions, $size, $direction, $query);
	}

	private function ExecRankingQuery($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $datasetType, $hasDescriptions, $size, $direction, $query, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "IFNULL(sna_" . $variableId . "_value, 0) Value, IFNULL(sna_" . $variableId . "_total, 0) Total, sna_feature_id FeatureId,
								sna_" . $variableId . "_value_label_id ValueId, round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(sna_location), ". GeoJson::PRECISION .")  as Lon";
		if ($hasDescriptions)
		{
			$select .= ", sna_description Name ";
		}
		else if ($datasetType == 'L' || $datasetType == 'S')
		{
			// Pone la ubicación
			$select .= ", CONCAT('[', round(ST_Y(sna_location), ". GeoJson::PRECISION ."), ',', round(ST_X(sna_location), ". GeoJson::PRECISION ."), ']') Name ";
		}
		else
		{
			// Pone descripción o código
			$select .= ", (SELECT IFNULL(gei_caption, gei_code) FROM geography_item WHERE gei_id = sna_geography_item_id) Name ";
		}
		$from = $this->tableName;

		$where = $this->spatialConditions->UrbanityCondition($urbanity);

		if ($hasTotals)
		{
			if ($where != '') $where .= ' AND ';
			$where .= " IFNULL(sna_" . $variableId . "_total, 0) > 0 ";
		}
		$params = array($metricVersionId, $geographyId, $variableId);

		if ($hasTotals)
		{
			$orderBy = "CASE WHEN Total = 0 THEN 0 ELSE Value / Total END";
		}
		else
		{
			$orderBy = "Value";
		}
		$orderBy .= ($direction === 'D' ? ' DESC' : ' ASC');

		$baseQuery = new QueryPart($from, $where, $params, $select, null, $orderBy);

		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);

		$multiQuery->setMaxRows($size);

		$ret = $multiQuery->fetchAll();

		Profiling::EndTimer();
		return $ret;
	}
}


