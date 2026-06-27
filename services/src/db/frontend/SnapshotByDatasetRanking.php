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
	private $partition;
	private $hiddenValueLabels;
	private $hasTotals;
	private $hasDescriptions;
	private $size;
	private $direction;
	private $isGap;
	private $isPercentage;

	public function __construct($snapshotTable, $datasetType,
		$variableId, $isGap, $isPercentage,
		$hasTotals, $urbanity, $partition, $hasDescriptions,
		$size, $direction, $hiddenValueLabels)
	{
		$this->variableId = $variableId;
		$this->urbanity = $urbanity;
		$this->partition = $partition;
		$this->hiddenValueLabels = $hiddenValueLabels;

		$this->hasTotals = $hasTotals;
		$this->hasDescriptions = $hasDescriptions;
		$this->size = $size;
		$this->direction = $direction;

		$this->isGap = $isGap;
		$this->isPercentage = $isPercentage;

		parent::__construct($snapshotTable, 'sna', $datasetType);
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$totalField = "sna_" . $this->variableId . "_total";

		$select = "IFNULL(sna_" . $this->variableId . "_value, 0) Value, " . $totalField . " Total, sna_feature_id FeatureId,
								sna_" . $this->variableId . "_value_label_id ValueId, ST_AsText(sna_envelope) Envelope, round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(sna_location), ". GeoJson::PRECISION .")  as Lon";
		if ($this->isGap)
		{
			$select .= ",IFNULL(sna_" . $this->variableId . "_value_gap, 0) ValueGap, " . $totalField . "_gap TotalGap";
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
			$where .= $totalField . " > 0 ";
		}

		// Excluye las filas filtradas
		$where = $this->AddNotNullCondition($where, $totalField);

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

	public static function CalculateValueSql($isGap, $isPercentage, $hasTotals, $suffix = "")
	{
		if (!$isGap)
		{
			if ($hasTotals)
				return "(CASE WHEN Total" . $suffix . " = 0 THEN 0 ELSE Value" . $suffix . " / Total" . $suffix . " END)";
			else
				return "Value" . $suffix;
		}
		else
		{
			if ($hasTotals)
			{
				if ($isPercentage)
					return "(Value" . $suffix . "Gap / Total" . $suffix . "Gap) - (Value" . $suffix . " / Total" . $suffix . ")";
				else
					return "((Value" . $suffix . "Gap / Total" . $suffix . "Gap) / (Value" . $suffix . " / Total" . $suffix . ") - 1) * 100";
			}
			else
				return "(Value" . $suffix . "Gap / Value" . $suffix . " - 1) * 100";
		}
	}

	private function hiddenValuesCondition()
	{
		if (sizeof($this->hiddenValueLabels) === 0)
			return "";
		else
			return " AND sna_" . $this->variableId . "_value_label_id NOT IN(" . implode(",", $this->hiddenValueLabels) . ") ";
	}

}


