<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotByDatasetNeighbors extends BaseModel
{
	private $spatialConditions;
	private const MAX_ROWS = 250;

	public function __construct($snapshortTable)
	{
		$this->tableName = $snapshortTable;
		$this->idField = 'sna_id';
		$this->captionField = '';
		$this->spatialConditions = new SpatialConditions('sna');
	}

	public function GetMetricVersionNeighborsByRegionIds($geographyId, $variable, $urbanity, $clippingRegionIds, $circle, $datasetType, $hiddenValueLabels)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionIds, $geographyId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);
		else
			$circleQuery = null;

		return $this->ExecNeighborsQuery($geographyId, $variable, $urbanity, $datasetType, $hiddenValueLabels, $query, $circleQuery);
	}

	public function GetMetricVersionNeighborsByEnvelope($geographyId, $variable, $urbanity, $envelope, $datasetType, $hiddenValueLabels)
	{
		$query = $this->spatialConditions->CreateSimpleEnvelopeQuery($envelope);

		return $this->ExecNeighborsQuery($geographyId, $variable, $urbanity, $datasetType, $hiddenValueLabels, $query);
	}

	public function GetMetricVersionNeighborsByCircle($geographyId, $variable, $urbanity, $circle, $datasetType, $hiddenValueLabels)
	{
		$query =  $this->spatialConditions->CreateCircleQuery($circle, $datasetType);

		return $this->ExecNeighborsQuery($geographyId, $variable, $urbanity, $datasetType, $hiddenValueLabels, $query);
	}

	private function ExecNeighborsQuery($geographyId, $variable, $urbanity, $datasetType, $hiddenValueLabels, $query, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "sna_feature_id FeatureId
								, round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat
								, round(ST_X(sna_location), ". GeoJson::PRECISION .") as Lon";
		if ($datasetType !== 'L')
			$select .= ", ST_AsText(sna_envelope) Envelope";
		else
			$select .= ", null as Envelope";

		$from = $this->tableName;

		$where = $this->hiddenValuesCondition($variable->Id, $hiddenValueLabels);

		$where .= $this->spatialConditions->UrbanityCondition($urbanity);

		$params = array();

		$sequenceQuery = $this->resolveSequenceQuery($variable);

		$baseQuery = new QueryPart($from, $where, $params, $select);

		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery, $sequenceQuery);

		$multiQuery->setMaxRows(self::MAX_ROWS);

		$ret = $multiQuery->fetchAll();

		Profiling::EndTimer();
		return $ret;
	}
	private function resolveSequenceQuery($variable)
	{
		if (!$variable->IsSequence) return null;

		$variableId = $variable->Id;
		$orderBy = "sna_" . $variableId . "_value_label_id, sna_" . $variableId . "_sequence_order";
		$select = "sna_" . $variableId . "_value_label_id ValueId, sna_" . $variableId . "_sequence_order Sequence";

		return new QueryPart(null, null, null, $select, null, $orderBy);
	}

	private function hiddenValuesCondition($variableId, $hiddenValueLabels)
	{
		if (sizeof($hiddenValueLabels) === 0)
			return "";
		else
			return " AND sna_" . $variableId . "_value_label_id NOT IN(" . implode(",", $hiddenValueLabels) . ") ";
	}

}


