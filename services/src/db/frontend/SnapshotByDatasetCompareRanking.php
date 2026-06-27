<?php

namespace helena\db\frontend;

use minga\framework\Profiling;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\App;
use helena\classes\GeoJson;

class SnapshotByDatasetCompareRanking extends BaseSpatialSnapshotModel
{
	private $variableId;
	private $variableCompareId;
	private $urbanity;
	private $partition;
	private $hiddenValueLabels;
	private $hasTotals;
	private $hasDescriptions;
	private $size;
	private $direction;
	private $isGap;
	private $isPercentage;

	public function __construct($snapshotTable, $datasetType,
		$variableId, $variableCompareId, $isGap, $isPercentage, $hasTotals, $urbanity, $partition,
		$hasDescriptions, $size, $direction, $hiddenValueLabels)
	{
		$this->variableId = $variableId;
		$this->variableCompareId = $variableCompareId;
		$this->urbanity = $urbanity;
		$this->partition = $partition;
		$this->hiddenValueLabels = $hiddenValueLabels;
		$this->isGap = $isGap;
		$this->isPercentage = $isPercentage;

		$this->hasTotals = $hasTotals;
		$this->hasDescriptions = $hasDescriptions;
		$this->size = $size;
		$this->direction = $direction;

		parent::__construct($snapshotTable, 'sna', $datasetType);
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$totalField = "sna_" . $this->variableId . "_total";

		$select = "IFNULL(sna_" . $this->variableId . "_value, 0) Value, "
					. $totalField . " Total, "
					. "IFNULL(sna_" . $this->variableCompareId . "_value, 0) ValueCompare,"
					. " sna_" . $this->variableCompareId . "_total TotalCompare,"
					. "	sna_feature_id FeatureId, "
					. " sna_" . $this->variableId . "_" . $this->variableCompareId . "_value_label_id ValueId, "
					. "ST_AsText(sna_envelope) Envelope, round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(sna_location), ". GeoJson::PRECISION .")  as Lon";

		if ($this->isGap)
		{
			$select .= ",IFNULL(sna_" . $this->variableId . "_value_gap, 0) ValueGap, "
				. $totalField . "_gap TotalGap, "
				. "IFNULL(sna_" . $this->variableCompareId . "_value_gap, 0) ValueCompareGap,"
				. " sna_" . $this->variableCompareId . "_total_gap TotalCompareGap";
		}
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

		$where = $this->AddPartitionCondition($where, $this->partition);

		// Filtra que no haya totales = 0 si está normalizado
		if ($this->hasTotals)
		{
			if ($where != '') $where .= ' AND ';
			$where .= $totalField . " > 0 AND sna_" . $this->variableCompareId . "_total > 0 ";
		}

		// Excluye las filas filtradas
		$where = $this->AddNotNullCondition($where, $totalField);

		// Setea el orden
		$orderBy = self::CalculateValueSql($this->isGap, $this->isPercentage, $this->hasTotals);

		// Setea la dirección
		$orderBy .= ($this->direction === 'D' ? ' DESC' : ' ASC');

		// Ejecuta la consulta
		$params = array();
		$baseQuery = new QueryPart($from, $where, $params, $select, null, $orderBy);
		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);
		$multiQuery->setMaxRows($this->size);
		$ret = $multiQuery->fetchAll();

		Profiling::EndTimer();
		return $ret;
	}

	public static function CalculateValueSql($isGap, $isPercentage, $hasTotals)
	{
		$part1 = SnapshotByDatasetRanking::CalculateValueSql($isGap, $isPercentage, $hasTotals);
		$part2 = SnapshotByDatasetRanking::CalculateValueSql($isGap, $isPercentage, $hasTotals, "Compare");
		$useProportional = !$isPercentage;
		if ($isGap)
			$useProportional = !$useProportional;

		if ($useProportional)
			return "((" . $part2 . " / " . $part1 . " - 1) * 100)";
		else
			return "(" . $part2 . " - " . $part1 . ")";
	}

	private function hiddenValuesCondition()
	{
		if (sizeof($this->hiddenValueLabels) === 0)
			return "";
		else
			return " AND sna_" . $this->variableId . "_" . $this->variableCompareId . "_value_label_id NOT IN(" . implode(",", $this->hiddenValueLabels) . ") ";
	}
}


