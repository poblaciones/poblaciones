<?php

namespace helena\services\backoffice\metrics;

use helena\classes\App;
use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;
use helena\entities\backoffice as entities;
use helena\services\backoffice\DatasetColumnService;
use minga\framework\Profiling;
use minga\framework\Str;

class MetricsCalculator
{
	const ColPrefix = 'dst_';

	public function StepCreateColumn($datasetId, $source, $output)
	{
		Profiling::BeginTimer();
		try
		{
			$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
			$srcDataset = $this->GetSrcDataset($source['VariableId']);
			$datasetName = $srcDataset->getCaption();

			$cols = [];
			$cols['distance'] = $this->CreateColumn($dataset, $datasetName, 'distancia_kms', 'Distancia (kms)');

			if($output['HasDescription'])
				$cols['description'] = $this->CreateTextColumn($dataset, $datasetName, 'description', 'Descripción');
			else
				$this->DeleteColumn($dataset, $datasetName, 'description');

			if($output['HasValue'])
			{
				$cols['value'] = $this->CreateColumn($dataset, $datasetName, 'value', 'Valor');
				$variable = App::Orm()->find(entities\Variable::class, $source['VariableId']);
				if($variable->getNormalization() !== null)
					$cols['total'] = $this->CreateColumn($dataset, $datasetName, 'total', 'Total');
			}
			else
			{
				$this->DeleteColumn($dataset, $datasetName, 'value');
				$this->DeleteColumn($dataset, $datasetName, 'total');
			}

			if($output['HasCoords'])
			{
				$cols['lat'] = $this->CreateColumn($dataset, $datasetName, 'latitud', 'Latitud', 24, 8);
				$cols['lon'] = $this->CreateColumn($dataset, $datasetName, 'longitud', 'Longitud', 24, 8);
			}
			else
			{
				$this->DeleteColumn($dataset, $datasetName, 'latitud');
				$this->DeleteColumn($dataset, $datasetName, 'longitud');
			}

			return $cols;
		}
		finally
		{
			Profiling::EndTimer();
		}
	}

	private function DeleteColumn($dataset, $datasetName, $field)
	{
		$datasetColumn = new DatasetColumnService();
		$name = $datasetColumn->GetCopyColumnName(self::ColPrefix, $datasetName, $field);
		$datasetColumn->DeleteColumn($dataset->getId(), $name);
	}

	private function CreateColumn($dataset, $datasetName, $field, $caption, $width = 11, $decimals = 2)
	{
		$datasetColumn = new DatasetColumnService();
		$name = $datasetColumn->GetCopyColumnName(self::ColPrefix, $datasetName, $field);
		if($datasetColumn->ColumnExists($dataset->getId(), $name))
			return $name;

		$col = $datasetColumn->CreateColumn($dataset, $name, $name,
			$caption, null, $width, $width, $decimals, Format::F,
			Measurement::Nominal, Alignment::Left, false, true);
		return $col->getField();
	}

	private function CreateTextColumn($dataset, $datasetName, $field, $caption)
	{
		$datasetColumn = new DatasetColumnService();
		$name = $datasetColumn->GetCopyColumnName(self::ColPrefix, $datasetName, $field);
		if($datasetColumn->ColumnExists($dataset->getId(), $name))
			return $name;

		$col = $datasetColumn->CreateColumn($dataset, $name, $name,
			$caption, null, 100, 250, 0, Format::A,
			Measurement::Nominal, Alignment::Left, false, true);
		return $col->getField();
	}

	public function StepPrepareData($datasetId, $cols, $source)
	{
		Profiling::BeginTimer();
		try
		{
			$srcDataset = $this->GetSrcDataset($source['VariableId']);
			$snapshotTable = $this->getSnapshotTable($srcDataset);
			$this->CreateTempTable($snapshotTable, $source);

			$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
			$this->ResetCols($dataset->getTable(), $cols);
		}
		finally
		{
			Profiling::EndTimer();
		}
	}

	public function StepUpdateDatasetDistance($datasetId, $cols, $source, $output)
	{
		Profiling::BeginTimer();
		try
		{
			$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
			$srcDataset = $this->GetSrcDataset($source['VariableId']);

			$sql = $this->GetUpdateQuery($dataset->getTable(),
			  	$this->getSnapshotTable($srcDataset),
				$this->GetDistanceColumn($dataset), $output, $cols, $source);

			$where = $this->GetDistanceWhereParams($output);
			return App::Db()->exec($sql, $where);
		}
		finally
		{
			Profiling::EndTimer();
		}
	}

	private function GetDistanceColumn($dataset)
	{
		$ret = [
			'col' => '',
			'join' => '',
			'where' => '1',
		];
		if ($dataset->getType() == 'L')
		{
			$ret['col'] = 'POINT(' . $dataset->getLongitudeColumn . ',' . $dataset->getLatitudeColumn . ')';
			$ret['where'] = $dataset->getLongitudeColumn . ' IS NOT NULL AND ' . $dataset->getLatitudeColumn . ' IS NOT NULL';
		}
		else if ($dataset->getType() == 'S')
		{
			$ret['col'] = 'centroid';
			$ret['where'] = 'centroid IS NOT NULL';
		}
		else if ($dataset->getType() == 'D')
		{
			$ret['col'] = 'gei_centroid';
			$ret['join'] = 'JOIN geography_item ON gei_id = geography_item_id';
		}
		return $ret;
	}

	private function CreateTempTable($snapshotTable, $source)
	{
		Profiling::BeginTimer();
		try
		{
			$drop = 'DROP TABLE IF EXISTS tmp_calculate_metric';
			$create = 'CREATE TABLE tmp_calculate_metric AS (
					SELECT sna_id, sna_location
					FROM ' . $snapshotTable . '
					WHERE sna_location IS NOT NULL
					' . $this->GetValueLabelsWhere($source) . ')';
			$index = 'CREATE SPATIAL INDEX sna_location ON tmp_calculate_metric (sna_location)';

			App::Db()->execDDL($drop);
			App::Db()->execDDL($create);
			App::Db()->execDDL($index);
		}
		finally
		{
			Profiling::EndTimer();
		}
	}

	private function ResetCols($datasetTable, $cols)
	{
		Profiling::BeginTimer();
		try
		{
			$update = 'UPDATE ' . $datasetTable . '
				SET ' . implode(' = null, ', $cols) . ' = null';
			return App::Db()->exec($update);
		}
		finally
		{
			Profiling::EndTimer();
		}
	}

	private function UseSTDistanceFunction() : int
	{
		Profiling::BeginTimer();
		try
		{
			$sql = 'SELECT VERSION()';
			$ret = App::Db()->fetchColumn($sql);
			if(Str::ContainsI($ret, 'mariadb') == false && version_compare($ret, '5.7.6', '>='))
				return 1;
			return 0;
		}
		finally
		{
			Profiling::EndTimer();
		}
	}

	private function GetUpdateQuery($datasetTable, $snapshotTable, $distance, $output, $cols, $source)
	{
		//TODO: Definir un máximo.
		$distMts = 5500 * 1000;
		if($output['HasMaxDistance'])
			$distMts = $output['MaxDistance'] * 1000;

		$useST = $this->UseSTDistanceFunction();

		$update = 'UPDATE ' . $datasetTable . '
			JOIN ' . $snapshotTable . '
			ON sna_id = NearestSnapshot(' . rand() . ', ' . $distance['col'] . ', ' . $distMts . ', ' . $useST . ')
			' . $distance['join'] . '
			SET '
			. $this->GetCoordsSet($output, $cols)
			. $this->GetDescriptionSet($output, $cols)
			. $this->GetValueSet($source, $output, $cols)
			. $this->GetTotalSet($source, $cols)
			. $cols['distance'] . ' = DistanceSphere(' . $distance['col'] . ', sna_location, ' . $useST . ')
			WHERE ' . $distance['where'] . '
			' . $this->GetDistanceWhere($output, $distance) . ';';

		return $update;
	}

	private function GetSrcDataset($variableId)
	{
		$variable = App::Orm()->find(entities\Variable::class, $variableId);
		$versionLevel = $variable->getMetricVersionLevel();
		return $versionLevel->getDataset();
	}

	private function GetDistanceWhere($output, $distance)
	{
		if($output['HasMaxDistance'])
			return ' AND ST_DISTANCE_SPHERE(' . $distance['col'] . ', sna_location) <= ?';
		return '';
	}

	private function GetValueLabelsWhere($source)
	{
		if(count($source['ValueLabelIds']) > 0)
			return ' AND sna_' . $source['VariableId'] . '_value_label_id IN (' . implode(',', array_map('intval', $source['ValueLabelIds'])) . ')';
		return '';
	}

	private function GetDistanceWhereParams($output)
	{
		if($output['HasMaxDistance'])
			return [(int)$output['MaxDistance'] * 1000];
		return [];
	}

	private function GetCoordsSet($output, $cols)
	{
		if($output['HasCoords'])
			return $cols['lat'] . ' = ST_Y(sna_location),' . $cols['lon'] . ' = ST_X(sna_location),';
		return '';
	}

	private function GetDescriptionSet($output, $cols)
	{
		if($output['HasDescription'])
			return $cols['description'] . ' = sna_description,';
		return '';
	}

	private function GetValueSet($source, $output, $cols)
	{
		if($output['HasValue'])
			return $cols['value'] . ' = sna_' . $source['VariableId'] . '_value,';
		return '';
	}

	private function GetTotalSet($source, $cols)
	{
		if(isset($cols['total']))
			return $cols['total'] . ' = sna_' . $source['VariableId'] . '_total,';
		return '';
	}

	private function getSnapshotTable($dataset)
	{
		return $dataset->getTable() . '_snapshot';
	}

	public function DistanceColumnExists($datasetId, $variableId)
	{
		$srcDataset = $this->GetSrcDataset($variableId);
		$datasetColumn = new DatasetColumnService();
		$name = $datasetColumn->GetCopyColumnName(self::ColPrefix, $srcDataset->getCaption(), 'distancia_kms');
		return $datasetColumn->ColumnExists($datasetId, $name);
	}

}
