<?php

namespace helena\services\backoffice\metrics;

use helena\classes\App;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;
use helena\entities\backoffice as entities;
use helena\services\backoffice\DatasetColumnService;
use minga\framework\Profiling;
use minga\framework\ErrorException;
use helena\services\backoffice\DatasetService;

class MetricsCalculator
{
	const ColPrefix = 'dst_';
	const STEP = 1000;

	public function StepCreateColumns($datasetId, $source, $output)
	{
		Profiling::BeginTimer();

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
			$cols['lat'] = $this->CreateColumn($dataset, $datasetName, 'latitud', 'Latitud', 11, 6);
			$cols['lon'] = $this->CreateColumn($dataset, $datasetName, 'longitud', 'Longitud', 11, 6);
		}
		else
		{
			$this->DeleteColumn($dataset, $datasetName, 'latitud');
			$this->DeleteColumn($dataset, $datasetName, 'longitud');
		}

		DatasetService::DatasetChangedById($datasetId);

		Profiling::EndTimer();

		return $cols;
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

	public function StepPrepareData($datasetId, $cols)
	{
		Profiling::BeginTimer();

		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$this->ResetCols($dataset->getTable(), $cols);

		Profiling::EndTimer();
	}

	public function GetTotalSlices($datasetId)
	{
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$sql = "SELECT count(*) FROM " . $dataset->getTable() . " WHERE ommit = 0";
		$count = App::Db()->fetchScalarInt($sql);
		return ceil($count / self::STEP);
	}

	public function StepUpdateDatasetDistance($key, $datasetId, $cols, $source, $output, $slice, $totalSlices)
	{
		Profiling::BeginTimer();

		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$srcDataset = $this->GetSrcDataset($source['VariableId']);

		// Crea la temporal
		$snapshotTable = SnapshotByDatasetModel::SnapshotTable($srcDataset->getTable());
		$this->CreateTempTable($snapshotTable, $source);

		$offset = $slice * self::STEP;
		// Actualiza el bloque
		$sql = $this->GetUpdateQuery($dataset->getTable(), SnapshotByDatasetModel::SnapshotTable($srcDataset->getTable()),
						$this->GetDistanceColumn($dataset), $output, $cols, $source, $offset, self::STEP);
		// Listo
		App::Db()->exec($sql, array($key));

		Profiling::EndTimer();

		return $slice + 1 >=  $totalSlices;
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
		else
		{
			throw new ErrorException('Tipo de dataset no reconocido');
		}
		return $ret;
	}

	private function CreateTempTable($snapshotTable, $source)
	{
		Profiling::BeginTimer();

		$create = 'CREATE TEMPORARY TABLE tmp_calculate_metric (sna_id int(11) not null,
												sna_location POINT NOT NULL, sna_r INT(11) NULL,
											SPATIAL INDEX (sna_location)) ENGINE=MYISAM';
		$insert = 'INSERT INTO tmp_calculate_metric (sna_id, sna_location, sna_r)
									SELECT  sna_id, sna_location, 0
									FROM ' . $snapshotTable . '
									WHERE 1 ' . $this->GetValueLabelsWhere($source);

		App::Db()->execDDL($create);
		App::Db()->exec($insert);

		Profiling::EndTimer();
	}

	private function ResetCols($datasetTable, $cols)
	{
		Profiling::BeginTimer();

		$update = 'UPDATE ' . $datasetTable . '
								SET ' . implode(' = null, ', $cols) . ' = null';
		$ret = App::Db()->exec($update);

		Profiling::EndTimer();

		return $ret;
	}

	private function GetUpdateQuery($datasetTable, $snapshotTable, $distance, $output, $cols, $source, $offset, $pageSize)
	{
		$distMts = 100 * 1000 * 1000;
		if($output['HasMaxDistance'])
			$distMts = $output['MaxDistance'] * 1000;

		$rangesSql = 'SELECT MIN(id) mi, MAX(id) ma FROM (SELECT id FROM ' . $datasetTable . ' WHERE ommit = 0
											ORDER BY id LIMIT ' . $offset . ', ' . $pageSize . ') as li';
		$ranges = App::Db()->fetchAssoc($rangesSql);

		$update = 'UPDATE ' . $datasetTable . '
			JOIN ' . $snapshotTable . '
			ON sna_id = NearestSnapshot(?, ' . $distance['col'] . ', ' . $distMts . ', null) '
				. $distance['join'] . '
			SET '
			. $this->GetCoordsSet($output, $cols)
			. $this->GetDescriptionSet($output, $cols)
			. $this->GetValueSet($source, $output, $cols)
			. $this->GetTotalSet($source, $cols)
			. $cols['distance'] . ' = ROUND(DistanceSphere(' . $distance['col'] . ', sna_location) / 1000, 3)
			WHERE ' . $distance['where'] . '
						AND id >= ' . $ranges['mi'] . ' AND id <= ' . $ranges['ma'];

		return $update;
	}

	private function GetSrcDataset($variableId)
	{
		$variable = App::Orm()->find(entities\Variable::class, $variableId);
		$versionLevel = $variable->getMetricVersionLevel();
		return $versionLevel->getDataset();
	}

	private function GetValueLabelsWhere($source)
	{
		if(count($source['ValueLabelIds']) > 0)
			return ' AND sna_' . $source['VariableId'] . '_value_label_id IN (' . implode(',', array_map('intval', $source['ValueLabelIds'])) . ')';
		else
			return '';
	}

	private function GetCoordsSet($output, $cols)
	{
		if($output['HasCoords'])
			return $cols['lat'] . ' = ST_Y(sna_location),' . $cols['lon'] . ' = ST_X(sna_location),';
		else
			return '';
	}

	private function GetDescriptionSet($output, $cols)
	{
		if($output['HasDescription'])
			return $cols['description'] . ' = sna_description,';
		else
			return '';
	}

	private function GetValueSet($source, $output, $cols)
	{
		if($output['HasValue'])
			return $cols['value'] . ' = sna_' . $source['VariableId'] . '_value,';
		else
			return '';
	}

	private function GetTotalSet($source, $cols)
	{
		if(isset($cols['total']))
			return $cols['total'] . ' = sna_' . $source['VariableId'] . '_total,';
		else
			return '';
	}

	public function DistanceColumnExists($datasetId, $variableId)
	{
		$srcDataset = $this->GetSrcDataset($variableId);
		$datasetColumn = new DatasetColumnService();
		$name = $datasetColumn->GetCopyColumnName(self::ColPrefix, $srcDataset->getCaption(), 'distancia_kms');
		return $datasetColumn->ColumnExists($datasetId, $name);
	}

}
