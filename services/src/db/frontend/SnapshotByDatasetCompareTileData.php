<?php

namespace helena\db\frontend;

use minga\framework\Arr;
use minga\framework\Profiling;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\App;
use helena\classes\GeoJson;
use helena\services\backoffice\publish\snapshots\MergeSnapshotsByDatasetModel;


class SnapshotByDatasetCompareTileData extends BaseSpatialSnapshotModel
{
	const LOCATIONS_LIMIT_PER_TILE = 500;
	const LOCATIONS_LIMIT_PER_TILE_SEGMENTS = 1500;

	private $variablePairs;
	private $urbanity;
	private $partition;
	private $hasSymbols;
	private $hasDescriptions;
	private $areSegments;
	public	$honorTileLimit = true;

	public function __construct($snapshotTable, $datasetType, $areSegments, $variablePairs, $urbanity, $partition,
		$hasSymbols, $hasDescriptions)
	{
		$this->variablePairs = $variablePairs;
		$this->urbanity = $urbanity;
		$this->partition = $partition;

		$this->areSegments = $areSegments;
		$this->hasSymbols = $hasSymbols;
		$this->hasDescriptions = $hasDescriptions;

		parent::__construct($snapshotTable, "sna", $datasetType);
	}

	protected function ExecQuery($query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();

		$select = "sna_feature_id FID";

		foreach($this->variablePairs as $variablePair)
		{
			$variable = $variablePair[0];
			$variableCompare = $variablePair[1];

			$varId = "sna_" . $variable->attributes['mvv_id'];
			$varIdCompare = "sna_" . $variableCompare->attributes['mvv_id'];

			$totalField = $varId  . "_total";
			$totalFieldCompare =  $varIdCompare  . "_total";

			$select .= ", " . $varId  . "_value,
						  " . $totalField;

			$select .= ", " . $varIdCompare . "_value,
					  	  " . $totalFieldCompare;

			$select .= ", "  . $varId . "_" . $variableCompare->attributes['mvv_id']. "_value_label_id";
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

		$where = $this->AddPartitionCondition($where, $this->partition);

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

		if ($this->datasetType == 'L' && $this->honorTileLimit)
		{
			if ($this->areSegments)
			 {
				if (sizeof($ret) > self::LOCATIONS_LIMIT_PER_TILE_SEGMENTS)
					$ret = Arr::SystematicSample($ret, self::LOCATIONS_LIMIT_PER_TILE_SEGMENTS);
			}
			 else
			 {
				if (sizeof($ret) > self::LOCATIONS_LIMIT_PER_TILE)
					$ret = Arr::SystematicSample($ret, self::LOCATIONS_LIMIT_PER_TILE);
			 }
		}
		Profiling::EndTimer();

		return $ret;
	}

	private function RotateResults($arr, $extraFields)
	{
		$ret = [];
		foreach($arr as $row)
		{
			foreach($this->variablePairs as $variablePair)
			{
				$variable = $variablePair[0];
				$variableCompare = $variablePair[1];

				$varId = "sna_" . $variable->attributes['mvv_id'];
				$varIdCompare = "sna_" . $variableCompare->attributes['mvv_id'];

				$totalField = $varId  . "_total";
				$totalFieldCompare = $varIdCompare  . "_total";

				if ($row[$totalField] !== null)
				{
					$item = [];
					foreach($extraFields as $field)
						$item[$field] = $row[$field];

					$item['FID'] = $row['FID'];

					// Pone lo específico de cada variable
					$item['VID'] = $variable->attributes['mvv_id'];
					$item['Value'] = $row[$varId . "_value"];
					$item['ValueCompare'] = $row[$varIdCompare . "_value"];
					$item['Total'] = $row[$totalField];
					$item['TotalCompare'] = $row[$totalFieldCompare];

					$item['LID'] = $row[$varId . "_" . $variableCompare->attributes['mvv_id']. "_value_label_id"];

					if ($this->hasSymbols)
						$item['Symbol'] = $row['Symbol'];

					$ret[] = $item;
				}
			}
		}
		return $ret;
	}
}


