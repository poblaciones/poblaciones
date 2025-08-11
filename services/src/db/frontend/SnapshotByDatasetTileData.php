<?php

namespace helena\db\frontend;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\Profiling;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

class SnapshotByDatasetTileData extends BaseSpatialSnapshotModel
{
	const LOCATIONS_LIMIT_PER_TILE = 500;
	const LOCATIONS_LIMIT_PER_TILE_SEGMENTS = 1500;

	private $variables;
	private $urbanity;
	private $partition;
	private $hasSymbols;
	private $hasDescriptions;
	private $areSegments;
	private $datasetId;
	public $honorTileLimit = true;
	public $requiresPolygons = false;

	public function __construct($snapshotTable, $datasetId, $datasetType, $areSegments, $variables, $urbanity, $partition,
		$hasSymbols, $hasDescriptions, $requiresPolygons = false)
	{
		$this->variables = $variables;
		$this->urbanity = $urbanity;
		$this->partition = $partition;
		$this->datasetId = $datasetId;
		$this->areSegments = $areSegments;
		$this->hasSymbols = $hasSymbols;
		$this->hasDescriptions = $hasDescriptions;
		$this->requiresPolygons = $requiresPolygons;

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

		$where = $this->AddPartitionCondition($where, $this->partition);

		// Trae filas donde no esté todos excluidos por filtro
		if ($hasAnyNotNullTotal !== '')
			$where .= ' AND (' . substr($hasAnyNotNullTotal, 4) . ')';

		// PolygonsQuery
		if ($this->requiresPolygons)
		{
			$polygonsQuery = new QueryPart("snapshot_shape_dataset_item", "sdi_dataset_id = ? AND sdi_dataset_item_id = sna_id", array($this->datasetId), "sdi_geometry as value");
			//			$polygonsQuery = new QueryPart("snapshot_shape_dataset_item", "sdi_dataset_id = ? AND sdi_dataset_item_id = sna_id", array($this->datasetId), "ST_AsText(sdi_geometry) as value");
		}
		else
			$polygonsQuery = null;
		// Ejecuta la consulta
		$baseQuery = new QueryPart($from, $where, null, $select, null, "sna_feature_id");
		$multiQuery = new MultiQuery($baseQuery, $query, $extraQuery, $polygonsQuery);
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
		$render = new GeoJson();

		foreach($arr as $row)
		{
			$item = [];
			$anyValue = false;

			// Pone lo general
			$item['FID'] = $row['FID'];
			if ($this->hasSymbols)
				$item['Symbol'] = $row['Symbol'];
			if ($this->requiresPolygons)
				$item['Data'] = $render->GenerateFeatureFromBinary($row, false, false, false, false, null);
			//	$item['Data'] = $row['value'];// $render->GenerateFeatureFromBinary($row, false, false, false, false, null);
			foreach ($extraFields as $field)
				$item[$field] = $row[$field];

			$values = [];
			foreach($this->variables as $variable)
			{
				$set = [];
				$total = $row["sna_" . $variable->Id . "_total"];
				if ($total !== null)
				{
					$anyValue = true;
					//
				/*	$set['VID'] = $variable->Id;
					$set['Value'] = $row["sna_" . $variable->Id . "_value"];
					$set['Total'] = $total;
					$set['LID'] = $row["sna_" . $variable->Id . "_value_label_id"];
					if ($variable->IsSequence)
						$item['Sequence'] = $row["sna_" . $variable->Id . "_sequence_order"];
				*/
					// Pone lo específico de cada variable
					$set[] = $variable->Id;
					$set[] = $row["sna_" . $variable->Id . "_value"];
					$set[] = $total;
					$set[] = $row["sna_" . $variable->Id . "_value_label_id"];
					if ($variable->IsSequence)
						$item[] = $row["sna_" . $variable->Id . "_sequence_order"];
				}
				$values[] = $set;
			}
			if ($anyValue)
			{
				$item['Values'] = $values;
				$ret[] = $item;
			}
		}
		return $ret;
	}

}


