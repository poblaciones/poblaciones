<?php

namespace helena\db\frontend;

use minga\framework\Profiling;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotByDatasetRanking extends BaseSpatialSnapshotModel
{
	private $variableId;
	private $urbanity;
	private $hiddenValueLabels;
	private $hasTotals;
	private $hasDescriptions;
	private $size;
	private $direction;

	public function __construct($snapshotTable, $datasetType,
		$variableId, $hasTotals, $urbanity, $hasDescriptions, $size, $direction, $hiddenValueLabels)
	{
		$this->variableId = $variableId;
		$this->urbanity = $urbanity;
		$this->hiddenValueLabels = $hiddenValueLabels;

		$this->hasTotals = $hasTotals;
		$this->hasDescriptions = $hasDescriptions;
		$this->size = $size;
		$this->direction = $direction;

		parent::__construct($snapshotTable, 'sna', $datasetType);
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "IFNULL(sna_" . $this->variableId . "_value, 0) Value, IFNULL(sna_" . $this->variableId . "_total, 0) Total, sna_feature_id FeatureId,
								sna_" . $this->variableId . "_value_label_id ValueId, ST_AsText(sna_envelope) Envelope, round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(sna_location), ". GeoJson::PRECISION .")  as Lon";
		if ($this->hasDescriptions)
		{
			$select .= ", sna_description Name ";
		}
		else if ($this->datasetType == 'L' || $this->datasetType == 'S')
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

		$where = $this->hiddenValuesCondition();

		$where .= $this->spatialConditions->UrbanityCondition($this->urbanity);

		if ($this->hasTotals)
		{
			if ($where != '') $where .= ' AND ';
			$where .= " IFNULL(sna_" . $this->variableId . "_total, 0) > 0 ";
		}
		$params = array();

		if ($this->hasTotals)
		{
			$orderBy = "CASE WHEN Total = 0 THEN 0 ELSE Value / Total END";
		}
		else
		{
			$orderBy = "Value";
		}
		$orderBy .= ($this->direction === 'D' ? ' DESC' : ' ASC');

		$baseQuery = new QueryPart($from, $where, $params, $select, null, $orderBy);

		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);

		$multiQuery->setMaxRows($this->size);

		$ret = $multiQuery->fetchAll();

		Profiling::EndTimer();
		return $ret;
	}

	private function hiddenValuesCondition()
	{
		if (sizeof($this->hiddenValueLabels) === 0)
			return "";
		else
			return " AND sna_" . $this->variableId . "_value_label_id NOT IN(" . implode(",", $this->hiddenValueLabels) . ") ";
	}

}


