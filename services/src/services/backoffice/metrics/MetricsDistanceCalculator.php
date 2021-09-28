<?php

namespace helena\services\backoffice\metrics;

use helena\classes\App;
use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;
use helena\entities\backoffice as entities;
use helena\services\backoffice\DatasetColumnService;
use helena\services\backoffice\DatasetService;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\services\frontend\SelectedMetricService;
use minga\framework\PublicException;
use minga\framework\Profiling;
use minga\framework\Str;

class MetricsDistanceCalculator extends MetricsBaseCalculator
{
	public function StepCreateColumns($datasetId, $source, $output)
	{
		Profiling::BeginTimer();

		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$variable = App::Orm()->find(entities\Variable::class, $source['VariableId']);
		$versionLevel = $variable->getMetricVersionLevel();
		$srcDataset = $versionLevel->getDataset();
		$datasetName = $srcDataset->getCaption();
		$metric = $this->GetMetricElements($source);

		$cols = [];

		$cols['distance'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'distancia_km', 'Distancia');

		if($output['HasDescription'])
			$cols['description'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'description', 'Descripción', 0, 100, 250, Format::A);
		else
			$this->DeleteColumn($dataset, $datasetName, 'description');

		if($output['HasValue'])
		{
			$cols['value'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'value', 'Valor');
			if($variable->getNormalization() !== null)
				$cols['total'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'total', 'Total');
		}
		else
		{
			$this->DeleteColumn($dataset, $datasetName, 'value');
			$this->DeleteColumn($dataset, $datasetName, 'total');
		}

		if($output['HasCoords'])
		{
			$cols['lat'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'latitud', 'Latitud', 6);
			$cols['lon'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'longitud', 'Longitud', 6);
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

	public function StepUpdateDataset($key, $datasetId, $cols, $source,
																						$output, $slice, $totalSlices)
	{
		Profiling::BeginTimer();

		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);

		// Crea la temporal
		$srcDataset = $this->GetSourceDatasetByVariableId($source['VariableId']);
		$this->CreateTempTable($source, $srcDataset);

		$offset = $slice * self::STEP;
		// Actualiza el bloque
		$sql = $this->GetUpdateQuery($dataset->getTable(),
						SnapshotByDatasetModel::SnapshotTable($source['datasetTable']),
						$this->GetDistanceColumn($dataset, $source['datasetType']),
						$output, $cols, $source, $offset, self::STEP);
		// Listo
		App::Db()->exec($sql, array($key));

		Profiling::EndTimer();

		return $slice + 1 >= $totalSlices;
	}

	private function GetDistanceColumn($dataset, $sourceType)
	{
		$ret = [
			'col' => '',
			'join' => '',
			'srcJoin' => '',
			'where' => '1',
		];
		if ($dataset->getType() == 'L')
		{
			$ret['col'] = 'POINT(' . $dataset->getLongitudeColumn()->getField() . ',' . $dataset->getLatitudeColumn()->getField() . ')';
			$ret['where'] = $dataset->getLongitudeColumn()->getField() . ' IS NOT NULL AND ' . $dataset->getLatitudeColumn()->getField() . ' IS NOT NULL';
		}
		else if ($dataset->getType() == 'S')
		{
			$ret['col'] = 'centroid';
		}
		else if ($dataset->getType() == 'D')
		{
			$ret['col'] = 'gei_centroid';
			$ret['join'] = 'JOIN geography_item ON gei_id = geography_item_id';
		}
		else
		{
			throw new PublicException('Tipo de dataset no reconocido');
		}

		if ($sourceType == 'S')
		{
			$ret['srcJoin'] = 'JOIN snapshot_shape_dataset_item ON sdi_feature_id = sna_feature_id';
			$ret['geo'] = 'sdi_geometry';
			$ret['distanceFn'] = 'DistanceSphereGeometry';
			$ret['nearestFn'] = 'NearestSnapshotShape';
		}
		else if ($sourceType == 'D')
		{
			$ret['srcJoin'] = 'JOIN geography_item ON gei_id = sna_geography_item_id';
			$ret['geo'] = 'coalesce(gei_geometry_r5, gei_geometry_r6, gei_geometry)';
			$ret['distanceFn'] = 'DistanceSphereGeometry';
			$ret['nearestFn'] = 'NearestSnapshotGeography';
		}
		else if ($sourceType == 'L')
		{
			$ret['geo'] = '';
			$ret['distanceFn'] = 'DistanceSphere';
			$ret['nearestFn'] = 'NearestSnapshotPoint';
		}
		else throw new \Exception("Unsupported dataset type.");

		return $ret;
	}


	private function GetUpdateQuery($datasetTable, $sourceSnapshotTable, $distance, $output, $cols, $source, $offset, $pageSize)
	{
		$distMts = 100 * 1000 * 1000;
		if($output['HasMaxDistance'])
			$distMts = $output['MaxDistance'] * 1000;

		$rangesSql = 'SELECT MIN(id) mi, MAX(id) ma FROM (SELECT id FROM ' . $datasetTable . ' WHERE ommit = 0
											ORDER BY id LIMIT ' . $offset . ', ' . $pageSize . ') as li';
		$ranges = App::Db()->fetchAssoc($rangesSql);

		$update = 'UPDATE ' . $datasetTable . ' '
				. $distance['join'] .
			' JOIN ' . $sourceSnapshotTable . '
			ON sna_id = ' . $distance['nearestFn'] . '(?, ' . $distance['col'] . ', ' . $distMts . ', null) '
				. $distance['srcJoin']
			. ' SET '
			. $this->GetCoordsSet($output, $cols)
			. $this->GetDescriptionSet($output, $cols)
			. $this->GetValueSet($source, $output, $cols)
			. $this->GetTotalSet($source, $cols)
			. $cols['distance']['Field'] . ' = ROUND(' . $distance['distanceFn'] . '(' . $distance['col'] . ', sna_location' .
						($distance['geo'] ? ',' . $distance['geo'] : '') . ') / 1000, 3)
			WHERE ' . $distance['where'] . '
						AND id >= ' . $ranges['mi'] . ' AND id <= ' . $ranges['ma'];

		return $update;
	}

	private function GetCoordsSet($output, $cols)
	{
		if($output['HasCoords'])
			return $cols['lat']['Field'] . ' = ST_Y(sna_location),' . $cols['lon']['Field'] . ' = ST_X(sna_location),';
		else
			return '';
	}

	private function GetDescriptionSet($output, $cols)
	{
		if($output['HasDescription'])
			return $cols['description']['Field'] . ' = sna_description,';
		else
			return '';
	}

	private function GetValueSet($source, $output, $cols)
	{
		if($output['HasValue'])
			return $cols['value']['Field'] . ' = sna_' . $source['VariableId'] . '_value,';
		else
			return '';
	}

	private function GetTotalSet($source, $cols)
	{
		if(isset($cols['total']))
			return $cols['total']['Field'] . ' = sna_' . $source['VariableId'] . '_total,';
		else
			return '';
	}
	protected function GetCaptionContent($element)
	{
		if ($element == "Distancia")
			return " con";
		else
			return " del elemento más cercano en";
	}

	public function DistanceColumnExists($datasetId, $variableId)
	{
		$srcDataset = $this->GetSourceDatasetByVariableId($variableId);

		$datasetColumn = new DatasetColumnService();
		$name = $this->GetColumnName($srcDataset->getCaption(), 'distancia_km');
		return $datasetColumn->ColumnExists($datasetId, $name);
	}


}
