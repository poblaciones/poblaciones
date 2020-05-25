<?php

namespace helena\services\backoffice\metrics;

use helena\classes\App;
use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;
use helena\entities\backoffice as entities;
use helena\services\backoffice\DatasetColumnService;
use minga\framework\ErrorException;
use minga\framework\Profiling;
use minga\framework\Db;

class MetricsCalculator
{
	// El máximo de registros que procesa para calcular la distancia se basa en
	// un producto cruzado de "todos contra todos", para calcular el tamaño de
	// los slices toma en cuenta cuantos registros puede multiplicar en un
	// tiempo determinado, 5 millones equivale a procesar mil registros por
	// vez contra un snapshot de 5000 registros. Ajustar en función de los
	// recursos del servidor.
	const CrossProductMax = 5000000;

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

	public function UpdateDatasetDistance($datasetId, $cols, $source, $output, $slice, $limit)
	{
		Profiling::BeginTimer();
		try
		{
			$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
			$srcDataset = $this->GetSrcDataset($source['VariableId']);

			$offset = $slice * $limit;

			$sql = $this->GetUpdateQuery($dataset->getTable(),
			  	$this->getSnapshotTable($srcDataset),
				$output, $cols, $source, $offset, $limit);

			$where = $this->GetDistanceWhereValues($output);
			return App::Db()->exec($sql, $where);
		}
		finally
		{
			Profiling::EndTimer();
		}
	}

	private function GetUpdateQuery($datasetTable, $snapshotTable, $output, $cols, $source, $offset, $count)
	{
		$coords = $this->GetCoordsFields($output, $cols);
		$description = $this->GetDescriptionFields($output, $cols);
		$value = $this->GetValueFields($source, $output, $cols);
		$total = $this->GetTotalFields($source, $cols);

		$crossProduct = 'SELECT dataset.id datid,
				' . $coords['crossField'] . '
				' . $description['crossField'] . '
				' . $value['crossField'] . '
				' . $total['crossField'] . '
				ST_DISTANCE_SPHERE(dataset.centroid, sna_location) distance
			FROM
				(SELECT id, centroid
				FROM ' . $datasetTable . '
				WHERE centroid IS NOT NULL
				LIMIT ' . $offset . ',' . $count . ') dataset
			CROSS JOIN
				' . $snapshotTable . ' snap
			WHERE
				sna_location IS NOT NULL '
				. $this->GetDistanceWhere($output)
				. $this->GetValueLabelsWhere($source);


		$update = 'UPDATE
				' . $datasetTable . ' dest
			JOIN
				(SELECT datid,
					' . $coords['field'] . '
					' . $description['field'] . '
					' . $value['field'] . '
					' . $total['field'] . '
					distance
				FROM
					(SELECT @prev := -1, @n := 0) init
				JOIN
					(SELECT *, @n := IF(datid != @prev, 1, @n + 1) AS rownum, @prev := datid
					FROM
						(' . $crossProduct . ') crossproduct
					ORDER BY datid, distance) valores
					WHERE rownum = 1) datos
			SET
				' . $coords['updateSet'] . '
				' . $description['updateSet'] . '
				' . $value['updateSet'] . '
				' . $total['updateSet'] . '
				' . $cols['distance'] . ' = CAST(distance AS DECIMAL(28, 8))
			WHERE dest.id = datid';

		return $update;
	}

	private function GetTotalDatasetRows($dataset)
	{
		$sql = 'SELECT COUNT(*) FROM '
			. $dataset->getTable()
			. ' WHERE centroid IS NOT NULL';
		return App::Db()->fetchScalarInt($sql);
	}

	private function GetTotalSnapshotRows($dataset, $source)
	{
		$sql = 'SELECT COUNT(*) FROM '
			. $this->getSnapshotTable($dataset)
			. ' WHERE sna_location IS NOT NULL'
			. $this->GetValueLabelsWhere($source);
		return App::Db()->fetchScalarInt($sql);
	}

	public function GetTotalSlices($datasetId, $source)
	{
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$srcDataset = $this->GetSrcDataset($source['VariableId']);

		$datasetRows = $this->GetTotalDatasetRows($dataset);
		$snapshotRows = $this->GetTotalSnapshotRows($srcDataset, $source);

		if($snapshotRows == 0)
		{
			return [
				'limit' => $datasetRows,
				'totalSlices' => 1,
			];
		}

		$limit = round(self::CrossProductMax / $snapshotRows);
		return [
			'limit' => $limit,
			'totalSlices' => ceil($datasetRows / $limit),
		];
	}

	private function GetSrcDataset($variableId)
	{
		$variable = App::Orm()->find(entities\Variable::class, $variableId);
		$versionLevel = $variable->getMetricVersionLevel();
		return $versionLevel->getDataset();
	}

	private function GetDistanceWhere($output)
	{
		if($output['HasMaxDistance'])
			return ' AND ST_DISTANCE_SPHERE(dataset.centroid, sna_location) <= ?';
		return '';
	}

	private function GetValueLabelsWhere($source)
	{
		if(count($source['ValueLabelIds']) > 0)
			return ' AND sna_' . $source['VariableId'] . '_value_label_id IN (' . implode(',', array_map('intval', $source['ValueLabelIds'])) . ')';
		return '';
	}

	private function GetDistanceWhereValues($output)
	{
		if($output['HasMaxDistance'])
			return [(int)$output['MaxDistance']];
		return [];
	}

	private function GetEmptyFields()
	{
		return [
			'field' => '',
			'crossField' => '',
			'updateSet' => '',
		];
	}

	private function GetCoordsFields($output, $cols)
	{
		if($output['HasCoords'] == false)
			return $this->GetEmptyFields();

		return [
			'field' => 'lat,lon,',
			'crossField' => 'ST_Y(sna_location) lat,ST_X(sna_location) lon,',
			'updateSet' => $cols['lat'] . ' = lat,' . $cols['lon'] . ' = lon,',
		];
	}

	private function GetDescriptionFields($output, $cols)
	{
		if($output['HasDescription'] == false)
			return $this->GetEmptyFields();

		return [
			'field' => 'description,',
			'crossField' => 'sna_description description,',
			'updateSet' => $cols['description'] . ' = description,',
		];
	}

	private function GetValueFields($source, $output, $cols)
	{
		if($output['HasValue'] == false || isset($cols['value']) == false)
			return $this->GetEmptyFields();

		return [
			'field' => 'val,',
			'crossField' => 'sna_' . $source['VariableId'] . '_value val,',
			'updateSet' => $cols['value'] . ' = val,',
		];
	}

	private function GetTotalFields($source, $cols)
	{
		if(isset($cols['total']) == false)
			return $this->GetEmptyFields();

		return [
			'field' => 'total,',
			'crossField' => 'sna_' . $source['VariableId'] . '_total total,',
			'updateSet' => $cols['total'] . ' = total,',
		];
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
