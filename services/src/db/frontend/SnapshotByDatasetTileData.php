<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotByDatasetTileData extends BaseModel
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

	public function GetMetricVersionTileDataByEnvelope($variables, $geographyId, $urbanity, $envelope, $datasetType, $hasSymbols, $hasDescriptions)
	{
		return $this->ExecTileDataQuery($variables, $geographyId, $urbanity, $envelope, $datasetType, $hasSymbols, $hasDescriptions);
	}

	public function GetMetricVersionTileDataByRegionIds($variables, $geographyId, $urbanity, $envelope, $clippingRegionIds, $circle, $datasetType, $hasSymbols, $hasDescriptions)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionIds, $geographyId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);
		else
			$circleQuery = null;

		return $this->ExecTileDataQuery($variables, $geographyId, $urbanity, $envelope, $datasetType, $hasSymbols, $hasDescriptions, $query, $circleQuery);
	}

	public function GetMetricVersionTileDataByCircle($variables, $geographyId, $urbanity, $envelope, $circle, $datasetType, $hasSymbols, $hasDescriptions)
	{
		$query =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);

		return $this->ExecTileDataQuery($variables, $geographyId, $urbanity, $envelope, $datasetType, $hasSymbols, $hasDescriptions, $query);
	}

	private function ExecTileDataQuery($variables, $geographyId, $urbanity, $envelope, $datasetType, $hasSymbols, $hasDescriptions, $query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "sna_feature_id FID";
		foreach($variables as $variable)
		{
			$select .= ", sna_" . $variable->Id . "_value, sna_" . $variable->Id . "_value_label_id,
									sna_" . $variable->Id . "_total";
			if ($variable->IsSequence)
				$select .= ", sna_" . $variable->Id . "_sequence_order";
		}

		$envelopeQuery =  $this->spatialConditions->CreateEnvelopeQuery($envelope);
		if ($hasDescriptions)
			$select .= ", sna_description Description";
		if ($hasSymbols)
			$select .= ", sna_symbol Symbol";

		if ($datasetType == 'L')
		{
			// Si es un metric de puntos, trae la ubicación del punto
			$select .= ", round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(sna_location), ". GeoJson::PRECISION .")  as Lon";
		}
		$from = $this->tableName;

		$where = $this->spatialConditions->UrbanityCondition($urbanity);

		$baseQuery = new QueryPart($from, $where, null, $select, null, "sna_feature_id");

		$multiQuery = new MultiQuery($baseQuery, $envelopeQuery, $query, $extraQuery);
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
		$ret = self::RotateResults($ret, $datasetType, $hasSymbols, $variables, $extraFields);

		if ($datasetType == 'L' && sizeof($ret) > self::LOCATIONS_LIMIT_PER_TILE)
		{
			$ret = Arr::SystematicSample($ret, self::LOCATIONS_LIMIT_PER_TILE);
		}
		Profiling::EndTimer();

		return $ret;
	}

	private function RotateResults($arr, $datasetType, $hasSymbols, $variables, $extraFields)
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
				if ($variable->IsSequence)
					$item['Sequence'] = $row["sna_" . $variable->Id . "_sequence_order"];
				if ($hasSymbols)
					$item['Symbol'] = $row['Symbol'];

				$ret[] = $item;
			}
		}
		return $ret;
	}

}


