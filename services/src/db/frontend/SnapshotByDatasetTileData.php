<?php

namespace helena\db\frontend;

use minga\framework\Arr;
use minga\framework\Profiling;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotByDatasetTileData extends BaseSpatialSnapshotModel
{
	const LOCATIONS_LIMIT_PER_TILE = 500;

	private $variables;
	private $urbanity;
	private $hasSymbols;
	private $hasDescriptions;
	private $areSegments;

	public function __construct($snapshotTable, $datasetType, $areSegments, $variables, $urbanity,
		$hasSymbols, $hasDescriptions)
	{
		$this->variables = $variables;
		$this->urbanity = $urbanity;
		$this->areSegments = $areSegments;
		$this->hasSymbols = $hasSymbols;
		$this->hasDescriptions = $hasDescriptions;

		parent::__construct($snapshotTable, "sna", $datasetType);
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "sna_feature_id FID";
		$hasAnyNotNullTotal = '';

		foreach($this->variables as $variable)
		{
			$totalField = "sna_" . $variable->Id . "_total";
			$select .= ", sna_" . $variable->Id . "_value, sna_" . $variable->Id . "_value_label_id,
									" . $totalField;
			$hasAnyNotNullTotal .= ' OR ' . $totalField . ' IS NOT NULL';
			if ($variable->IsSequence)
				$select .= ", sna_" . $variable->Id . "_sequence_order";
		}

		if ($this->hasDescriptions)
			$select .= ", sna_description Description";
		if ($this->hasSymbols)
			$select .= ", sna_symbol Symbol";
		if ($this->areSegments)
			$select .= ", sna_segment value";

		// Si es un metric de puntos, trae la ubicación del punto
		$select .= ", round(ST_Y(sna_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(sna_location), ". GeoJson::PRECISION .")  as Lon";

		$from = $this->tableName;

		$where = $this->spatialConditions->UrbanityCondition($this->urbanity);
		// Trae filas donde no esté todos excluidos por filtro
		if ($hasAnyNotNullTotal !== '')
			$where .= ' AND (' . substr($hasAnyNotNullTotal, 4) . ')';

		// Ejecuta la consulta
		$baseQuery = new QueryPart($from, $where, null, $select, null, "sna_feature_id");
		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery);
		$ret = $multiQuery->fetchAll();

		$extraFields = [];
		if ($this->hasDescriptions)
			$extraFields[] = 'Description';
		if ($this->areSegments)
			$extraFields[] = 'value';
		// Si es un metric de puntos, trae la ubicación del punto
		$extraFields[] = 'Lat';
		$extraFields[] = 'Lon';
		$ret = self::RotateResults($ret, $extraFields);

		if ($this->datasetType == 'L' && sizeof($ret) > self::LOCATIONS_LIMIT_PER_TILE)
		{
			$ret = Arr::SystematicSample($ret, self::LOCATIONS_LIMIT_PER_TILE);
		}
		Profiling::EndTimer();

		return $ret;
	}

	private function RotateResults($arr, $extraFields)
	{
		$ret = [];
		foreach($arr as $row)
		{
			foreach($this->variables as $variable)
			{
				$totalField = "sna_" . $variable->Id . "_total";
				if ($row[$totalField] !== null)
				{
					$item = [];
					foreach($extraFields as $field)
						$item[$field] = $row[$field];

					$item['FID'] = $row['FID'];

					// Pone lo específico de cada variable
					$item['VID'] = $variable->Id;
					$item['Value'] = $row["sna_" . $variable->Id . "_value"];
					$item['Total'] = $row[$totalField];
					$item['LID'] = $row["sna_" . $variable->Id . "_value_label_id"];
					if ($variable->IsSequence)
						$item['Sequence'] = $row["sna_" . $variable->Id . "_sequence_order"];
					if ($this->hasSymbols)
						$item['Symbol'] = $row['Symbol'];

					$ret[] = $item;
				}
			}
		}
		return $ret;
	}

}


