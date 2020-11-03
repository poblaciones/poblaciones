<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotByDatasetRanking extends BaseModel
{
	private $spatialConditions;

	public function __construct($snapshortTable)
	{
		$this->tableName = $snapshortTable;
		$this->idField = 'sna_id';
		$this->captionField = '';
		$this->spatialConditions = new SpatialConditions('sna');
	}

	public function GetMetricVersionRankingByRegionIds($geographyId, $variableId, $hasTotals, $urbanity, $clippingRegionIds, $circle, $datasetType, $hasDescriptions, $size, $direction, $hiddenValueLabels)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionIds, $geographyId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);
		else
			$circleQuery = null;

		return $this->ExecRankingQuery($geographyId, $variableId, $hasTotals, $urbanity, $datasetType, $hasDescriptions, $size, $direction, $hiddenValueLabels, $query, $circleQuery);
	}

	public function GetMetricVersionRankingByEnvelope($geographyId, $variableId, $hasTotals, $urbanity, $envelope, $datasetType, $hasDescriptions, $size, $direction, $hiddenValueLabels)
	{

		$query = $this->spatialConditions->CreateSimpleEnvelopeQuery($envelope);

		return $this->ExecRankingQuery($geographyId, $variableId, $hasTotals, $urbanity, $datasetType, $hasDescriptions, $size, $direction, $hiddenValueLabels, $query);
	}

	public function GetMetricVersionRankingByCircle($geographyId, $variableId, $hasTotals, $urbanity, $circle, $datasetType, $hasDescriptions, $size, $direction, $hiddenValueLabels)
	{
		$query =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);

		return $this->ExecRankingQuery($geographyId, $variableId, $hasTotals, $urbanity, $datasetType, $hasDescriptions, $size, $direction, $hiddenValueLabels, $query);
	}

	private function ExecRankingQuery($geographyId, $variableId, $hasTotals, $urbanity, $datasetType, $hasDescriptions, $size, $direction, $hiddenValueLabels, $query, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "IFNULL(sna_" . $variableId . "_value, 0) Value, IFNULL(sna_" . $variableId . "_total, 0) Total, sna_feature_id FeatureId,
								sna_" . $variableId . "_value_label_id ValueId, ST_AsText(sna_envelope) Envelope, round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(sna_location), ". GeoJson::PRECISION .")  as Lon";
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

		$where = $this->hiddenValuesCondition($variableId, $hiddenValueLabels);

		$where .= $this->spatialConditions->UrbanityCondition($urbanity);

		if ($hasTotals)
		{
			if ($where != '') $where .= ' AND ';
			$where .= " IFNULL(sna_" . $variableId . "_total, 0) > 0 ";
		}
		$params = array();

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

	private function hiddenValuesCondition($variableId, $hiddenValueLabels)
	{
		if (sizeof($hiddenValueLabels) === 0)
			return "";
		else
			return " AND sna_" . $variableId . "_value_label_id NOT IN(" . implode(",", $hiddenValueLabels) . ") ";
	}

}


