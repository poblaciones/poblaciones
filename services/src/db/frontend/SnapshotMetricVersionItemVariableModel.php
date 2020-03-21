<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotMetricVersionItemVariableModel extends BaseModel
{
	const LOCATIONS_LIMIT_PER_TILE = 500;
	private $spatialConditions;

	public function __construct()
	{
		$this->tableName = 'snapshot_metric_version_item_variable';
		$this->idField = 'miv_id';
		$this->captionField = '';
		$this->spatialConditions = new SpatialConditions('miv');
	}

	public function GetMetricVersionSummaryByRegionId($metricVersionId, $hasSummary, $geographyId, $urbanity, $clippingRegionId, $circle, $datasetType)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionId, $geographyId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateRichCircleQuery($circle, $datasetType, $metricVersionId, $geographyId);
		else
			$circleQuery = null;

		return $this->ExecSummaryQuery($metricVersionId, $hasSummary, $geographyId, $urbanity, $query, $circleQuery);
	}

	public function GetMetricVersionSummaryByEnvelope($metricVersionId, $hasSummary, $geographyId, $urbanity, $envelope)
	{
		$query = $this->spatialConditions->CreateRichEnvelopeQuery($envelope, $metricVersionId, $geographyId);

		return $this->ExecSummaryQuery($metricVersionId, $hasSummary, $geographyId, $urbanity,$query);
	}

	public function GetMetricVersionSummaryByCircle($metricVersionId, $hasSummary, $geographyId, $urbanity, $circle, $datasetType)
	{
		$query =  $this->spatialConditions->CreateRichCircleQuery($circle, $datasetType, $metricVersionId, $geographyId);

		return $this->ExecSummaryQuery($metricVersionId, $hasSummary, $geographyId, $urbanity, $query);
	}

	private function ExecSummaryQuery($metricVersionId, $hasSummary, $geographyId, $urbanity, $query, $extraQuery = null)
	{
		Profiling::BeginTimer();
		$select = "miv_metric_version_variable_id VariableId, miv_version_value_label_id ValueId, " .
			"SUM(IFNULL(miv_value, 0)) Value, SUM(IFNULL(miv_total, 0)) Total, Round(SUM(IFNULL(miv_area_m2, 0)) / 1000000, 6) Km2, COUNT(*) Areas ";

		$from = $this->tableName;

		$where = "miv_metric_version_id = ? AND miv_geography_id <=> ? " .	$this->spatialConditions->UrbanityCondition($urbanity);
		$params = array($metricVersionId, $geographyId);

		$groupBy = "miv_metric_version_variable_id, miv_version_value_label_id";

		$baseQuery = new QueryPart($from, $where, $params, $select, $groupBy);

		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);

//$multiQuery->dump();

		$ret = $multiQuery->fetchAll();
		Profiling::EndTimer();
		return $ret;
	}

	private function CreateCrossTableQuery($metricVersionId, $hasSummary, $geographyId, $urbanity, $query, $extraQuery = null)
	{
		Profiling::BeginTimer();
		$select = "t1.miv_metric_version_variable_id VariableId, t1.miv_version_value_label_id ValueId, t2.miv_metric_version_variable_id TargetVariableId, t2.miv_version_value_label_id TargetValueId, " .
			"SUM(IFNULL(t1.miv_value, 0)) Value, SUM(IFNULL(t1.miv_total, 0)) Total, Round(SUM(IFNULL(t1.miv_area_m2, 0)) / 1000000, 6) Km2, COUNT(*) Areas ";

		$from = $this->tableName . " t1";
		$join = " JOIN snapshop_geography_item_geography_item snap ON t1.miv_geography_item_id = snap.gii_from_geography_item_id LEFT JOIN " . $this->tableName . " t2 ON t2.miv_geography_item_id = snap.gii_to_geography_item_id";

		$where = "t1.miv_metric_version_id = ? AND t1.miv_geography_id <=> ? " .	$this->spatialConditions->UrbanityCondition($urbanity);
		$params = array($metricVersionId, $geographyId);

		$groupBy = "t1.miv_metric_version_variable_id, t1.miv_version_value_label_id, t2.miv_metric_version_variable_id, t2.miv_version_value_label_id";

		// TODO: falta duplicar los subqueries y crear snapshop_geography_item_geography_item
		$baseQuery = new QueryPart($from, $where, $params, $select, $groupBy);

		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);

		$ret = $multiQuery->fetchAll();
		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetricVersionTileDataByEnvelope($metricVersionId, $geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions)
	{
		return $this->ExecTileDataQuery($metricVersionId, $geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions);
	}

	public function GetMetricVersionTileDataByRegionId($metricVersionId, $geographyId, $urbanity, $envelope, $clippingRegionId, $circle, $datasetType, $hasDescriptions)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionId, $geographyId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);
		else
			$circleQuery = null;

		return $this->ExecTileDataQuery($metricVersionId,$geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions, $query, $circleQuery);
	}

	public function GetMetricVersionTileDataByCircle($metricVersionId, $geographyId, $urbanity, $envelope, $circle, $datasetType, $hasDescriptions)
	{
		$query =  $this->spatialConditions->CreateRichCircleQuery($circle, $datasetType, $metricVersionId, $geographyId);

		return $this->ExecTileDataQuery($metricVersionId, $geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions, $query);
	}

	private function ExecTileDataQuery($metricVersionId, $geographyId, $urbanity, $envelope, $datasetType, $hasDescriptions, $query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$envelopeQuery =  $this->spatialConditions->CreateRichEnvelopeQuery($envelope, $metricVersionId, $geographyId);

		$select = "miv_metric_version_variable_id VariableId, miv_value Value, miv_version_value_label_id ValueId, miv_feature_id FID";
		if ($hasDescriptions)
			$select .= ", miv_description Description";

		$select .= ", miv_total Total";

		if ($datasetType == 'L')
		{
			// Si es un metric de puntos, trae la ubicación del punto
			$select .= ", round(ST_Y(miv_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(miv_location), ". GeoJson::PRECISION .")  as Lon";
		}
		$from = $this->tableName;

		$where = "miv_metric_version_id = ? AND miv_geography_id = ? " .
			$this->spatialConditions->UrbanityCondition($urbanity);

		$params = array($metricVersionId, $geographyId);

		$baseQuery = new QueryPart($from, $where, $params, $select, null, "miv_feature_id");

		$multiQuery = new MultiQuery($baseQuery, $envelopeQuery, $query, $extraQuery);
		//$multiQuery->dump();
		$ret = $multiQuery->fetchAll();
		if ($datasetType == 'L' && sizeof($ret) > self::LOCATIONS_LIMIT_PER_TILE)
		{
			$ret = Arr::SystematicSample($ret, self::LOCATIONS_LIMIT_PER_TILE);
		}
		Profiling::EndTimer();

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
		$select = "IFNULL(miv_value, 0) Value, IFNULL(miv_total, 0) Total, miv_feature_id FeatureId,
								miv_version_value_label_id ValueId, round(ST_Y(miv_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(miv_location), ". GeoJson::PRECISION .")  as Lon";
		if ($hasDescriptions)
		{
			$select .= ", miv_description Name ";
		}
		else if ($datasetType == 'L' || $datasetType == 'S')
		{
			// Pone la ubicación
			$select .= ", CONCAT('[', round(ST_Y(miv_location), ". GeoJson::PRECISION ."), ',', round(ST_X(miv_location), ". GeoJson::PRECISION ."), ']') Name ";
		}
		else
		{
			// Pone descripción o código
			$select .= ", (SELECT IFNULL(gei_caption, gei_code) FROM geography_item WHERE gei_id = miv_geography_item_id) Name ";
		}
		$from = $this->tableName;

		$where = "miv_metric_version_id = ? AND miv_geography_id <=> ? " .	$this->spatialConditions->UrbanityCondition($urbanity) .
							" AND miv_metric_version_variable_id = ?";
		if ($hasTotals)
			$where .= " AND IFNULL(miv_total, 0) > 0 ";

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


