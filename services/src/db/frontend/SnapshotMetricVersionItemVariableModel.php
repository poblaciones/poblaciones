<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotMetricVersionItemVariableModel extends BaseModel
{
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

	public function GetMetricVersionSummaryByFeatureId($metricVersionId, $hasSummary, $geographyId, $urbanity, $clippingFeatureId)
	{
		$query =  $this->spatialConditions->CreateFeatureQuery($clippingFeatureId);

		return $this->ExecSummaryQuery($metricVersionId, $hasSummary, $geographyId, $urbanity, $query);
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

		$params = $query->Params;

		if ($extraQuery != null && $extraQuery->Params != null)
			$params = array_merge($params, $extraQuery->Params);

		$ret = App::Db()->fetchAll($multiQuery->sql, $multiQuery->params);
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
			$select .= ", round(Y(miv_location), ". GeoJson::PRECISION .") as Lat, round(X(miv_location), ". GeoJson::PRECISION .")  as Lon";
		}
		$from = $this->tableName;

		$where = "miv_metric_version_id = ? AND miv_geography_id = ? " .
			$this->spatialConditions->UrbanityCondition($urbanity);

		$params = array($metricVersionId, $geographyId);

		$baseQuery = new QueryPart($from, $where, $params, $select, null, "miv_feature_id");

		$multiQuery = new MultiQuery($baseQuery, $envelopeQuery, $query, $extraQuery);
		//$multiQuery->dump();
		$ret = App::Db()->fetchAll($multiQuery->sql, $multiQuery->params);
		return $ret;
	}
}


