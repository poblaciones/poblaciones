<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotByDatasetNeighbors extends BaseSpatialSnapshotModel
{
	private const MAX_ROWS = 250;

	private $variable;
	private $urbanity;
	private $hiddenValueLabels;

	public function __construct($snapshotTable, $datasetType,
											$variable, $urbanity, $hiddenValueLabels)
	{
		$this->variable = $variable;
		$this->urbanity = $urbanity;
		$this->hiddenValueLabels = $hiddenValueLabels;

		parent::__construct($snapshotTable, 'sna', $datasetType);
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "sna_feature_id FeatureId
								, round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat
								, round(ST_X(sna_location), ". GeoJson::PRECISION .") as Lon";
		if ($this->datasetType !== 'L')
			$select .= ", ST_AsText(sna_envelope) Envelope";
		else
			$select .= ", null as Envelope";

		$from = $this->tableName;

		$where = $this->hiddenValuesCondition($this->variable->Id);

		$where .= $this->spatialConditions->UrbanityCondition($this->urbanity);

		$params = array();

		$sequenceQuery = $this->resolveSequenceQuery();

		$baseQuery = new QueryPart($from, $where, $params, $select);

		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery, $sequenceQuery);

		$multiQuery->setMaxRows(self::MAX_ROWS);

		$ret = $multiQuery->fetchAll();

		Profiling::EndTimer();
		return $ret;
	}
	private function resolveSequenceQuery()
	{
		if (!$this->variable->IsSequence) return null;

		$variableId = $this->variable->Id;
		$orderBy = "sna_" . $variableId . "_value_label_id, sna_" . $variableId . "_sequence_order";
		$select = "sna_" . $variableId . "_value_label_id ValueId, sna_" . $variableId . "_sequence_order Sequence";

		return new QueryPart(null, null, null, $select, null, $orderBy);
	}

	private function hiddenValuesCondition($variableId)
	{
		if (sizeof($this->hiddenValueLabels) === 0)
			return "";
		else
			return " AND sna_" . $variableId . "_value_label_id NOT IN(" . implode(",", $this->hiddenValueLabels) . ") ";
	}

}


