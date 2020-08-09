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

class MetricsCalculator
{
	const ColPrefix = 'dst_';
	const STEP = 1000;

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

		$cols['distance'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'distancia_kms', 'Distancia');

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

	private function DeleteColumn($dataset, $datasetName, $field)
	{
		$datasetColumn = new DatasetColumnService();
		$name = $this->GetColumnName(self::ColPrefix, $datasetName, $field);
		$datasetColumn->DeleteColumn($dataset->getId(), $name);
	}

	private function CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName,
		$field, $caption, $decimals = 2, $colWidth = 11, $fieldWidth = 11, $format = Format::F)
	{
		$datasetColumn = new DatasetColumnService();
		$name = $this->GetColumnName(self::ColPrefix, $datasetName, $field);
		$caption = $this->GetColumnCaption($metric, $variable, $source, $output, $caption);

		$col = $datasetColumn->GetColumnByVariable($dataset->getId(), $name);
		if($col != null)
		{
			if($col->getCaption() != $caption)
				$datasetColumn->UpdateCaption($col, $caption);
			return $name;
		}

		$col = $datasetColumn->CreateColumn($dataset, $name, $name,
			$caption, null, $colWidth, $fieldWidth, $decimals, $format,
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

	public function StepUpdateDatasetDistance($key, $datasetId, $cols, $source,
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
			'geo' => '',
			'distanceFn' => 'DistanceSphere',
			'nearestFn' => 'NearestSnapshotPoint',
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
			$ret['geo'] = 'coalesce(sdi_geometry_r3, sdi_geometry_r2, sdi_geometry_r1)';
			$ret['distanceFn'] = 'DistanceSphereGeometry';
			$ret['nearestFn'] = 'NearestSnapshotShape';
		}
		else if ($sourceType == 'D')
		{
			$ret['srcJoin'] = 'JOIN geography_item ON gei_id = sna_geography_item_id';
			$ret['geo'] = 'coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1)';
			$ret['distanceFn'] = 'DistanceSphereGeometry';
			$ret['nearestFn'] = 'NearestSnapshotGeography';
		}

		return $ret;
	}

	private function CreateTempTable($source, $dataset)
	{
		Profiling::BeginTimer();

		$sourceSnapshotTable = SnapshotByDatasetModel::SnapshotTable($dataset->getTable());

		$id = $this->getGeometryFieldId($dataset->getType());

		$create = 'CREATE TEMPORARY TABLE tmp_calculate_metric (sna_id int(11) not null,
												sna_location POINT NOT NULL, sna_r INT(11) NULL, sna_feature_id BIGINT,
											SPATIAL INDEX (sna_location)) ENGINE=MYISAM';

		$insert = 'INSERT INTO tmp_calculate_metric (sna_id, sna_location, sna_r' .
									($id ? ', sna_feature_id ' : '') . ')
									SELECT sna_id, sna_location, 0 ' . ($id ? ',' . $id : '') . '
									FROM ' . $sourceSnapshotTable . '
									WHERE 1 ' . $this->GetValueLabelsWhere($source);

		App::Db()->execDDL($create);
		App::Db()->exec($insert);

		Profiling::EndTimer();
	}

	private function getGeometryFieldId($type)
	{
		if ($type == 'L')
		{
			return null;
		}
		else if ($type == 'S' || $type == 'D')
		{
			return 'sna_feature_id';
		}
		else
		{
			throw new PublicException('Tipo de dataset no reconocido');
		}
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

	private function GetUpdateQuery($datasetTable, $sourceSnapshotTable, $distance, $output, $cols, $source, $offset, $pageSize)
	{
		$distMts = 100 * 1000 * 1000;
		if($output['HasMaxDistance'])
			$distMts = $output['MaxDistance'] * 1000;

		$rangesSql = 'SELECT MIN(id) mi, MAX(id) ma FROM (SELECT id FROM ' . $datasetTable . ' WHERE ommit = 0
											ORDER BY id LIMIT ' . $offset . ', ' . $pageSize . ') as li';
		$ranges = App::Db()->fetchAssoc($rangesSql);

		$update = 'UPDATE ' . $datasetTable . '
			JOIN ' . $sourceSnapshotTable . '
			ON sna_id = ' . $distance['nearestFn'] . '(?, ' . $distance['col'] . ', ' . $distMts . ', null) '
				. $distance['join']
				. $distance['srcJoin']
			. ' SET '
			. $this->GetCoordsSet($output, $cols)
			. $this->GetDescriptionSet($output, $cols)
			. $this->GetValueSet($source, $output, $cols)
			. $this->GetTotalSet($source, $cols)
			. $cols['distance'] . ' = ROUND(' . $distance['distanceFn'] . '(' . $distance['col'] . ', sna_location' .
						($distance['geo'] ? ',' . $distance['geo'] : '') . ') / 1000, 3)
			WHERE ' . $distance['where'] . '
						AND id >= ' . $ranges['mi'] . ' AND id <= ' . $ranges['ma'];

		return $update;
	}

	private function GetValueLabelsWhere($source)
	{
		if(count($source['ValueLabelIds']) > 0)
			return ' AND sna_' . $source['VariableId'] . '_value_label_id IN (' . Str::JoinInts($source['ValueLabelIds']) . ')';
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
		$srcDataset = $this->GetSourceDatasetByVariableId($variableId);

		$datasetColumn = new DatasetColumnService();
		$name = $this->GetColumnName(self::ColPrefix, $srcDataset->getCaption(), 'distancia_kms');
		return $datasetColumn->ColumnExists($datasetId, $name);
	}

	public function GetSourceDatasetByVariableId($variableId)
	{
		$variable = App::Orm()->find(entities\Variable::class, $variableId);
		$versionLevel = $variable->getMetricVersionLevel();
		return $versionLevel->getDataset();
	}

	private function GetMetricElements($source)
	{
		$metricService = new SelectedMetricService();
		$metric = $metricService->PublicGetSelectedMetric($source['MetricId']);
		$version = $this->FindById($metric->Versions, $source['VersionId'], true);
		$level = $this->FindById($version->Levels, $source['LevelId']);
		$variable = $this->FindById($level->Variables, $source['VariableId']);

		return [
			'metric' => $metric,
			'version' => $version,
			'level' => $level,
			'variable' => $variable,
		];
	}

	private function GetColumnName($prefix, $datasetName, $srcColumnName, $maxLength = 64)
	{
		// El máximo de un nombre de columna en mysql es 64 por
		// eso el default de $maxLength = 64.
		$clean = Str::RemoveAccents($datasetName);
		$clean = Str::RemoveNonAlphanumeric($clean);
		$clean = Str::Replace($clean, ' ', '_');
		$len = Str::Length($clean) + Str::Length($prefix) + Str::Length($srcColumnName) + 1;
		if($len > $maxLength)
		{
			$newLen = Str::Length($clean) - ($len - $maxLength);
			if($newLen >= 0)
				$clean = Str::Substr($clean, 0, $newLen);
			else
			{
				$clean = '';
				$srcColumnName = Str::Substr($srcColumnName, 0, Str::Length($srcColumnName) + $newLen);
			}
		}

		return $prefix . $clean . '_' . $srcColumnName;
	}

	private function GetColumnCaption($metric, $variable, $source, $output, $caption, $maxLength = 255)
	{
		// - Distancia a radios con Hogares con al menos un indicador de NBI (2010) (> 10%, > 25%) [hasta 25 km]
		// - Valor de radios con Hogares con al menos un indicador de NBI (2010) (> 10%, > 25%) [hasta 25 km]
		// - Latitud de radios con Hogares con al menos un indicador de NBI (2010) (> 10%, > 25%) [hasta 25 km]
		$str = $caption . $this->GetDeA($caption)
			. $this->GetLevelName($metric)
			. $this->GetVariableName($metric, $variable)
			. $this->GetVersionName($metric)
			. $this->GetValueLabelsCaption($metric, $source)
			. $this->GetDistanceCaption($output);

		return Str::Ellipsis($str, $maxLength);
	}

	private function GetDeA($caption)
	{
		if($caption == 'Distancia')
			return ' a';
		return ' de';
	}

	private function GetLevelName($metric)
	{
		if(count($metric['version']->Levels) > 1)
			return ' ' . $metric['level']->Name . ' con';
		return '';
	}

	private function GetVariableName($metric, $variable)
	{
		if($variable->getData() == 'O')
			return ' ' . $variable->getCaption();
		return ' ' . $metric['metric']->Metric->Name;
	}

	private function GetVersionName($metric)
	{
		return ' (' . $metric['version']->Version->Name . ')';
	}

	private function GetValueLabelsCaption($metric, $source)
	{
		if(count($metric['variable']->ValueLabels) == count($source['ValueLabelIds']))
			return '';

		$ret = ' (';
		foreach($metric['variable']->ValueLabels as $label)
		{
			if(in_array($label->Id, $source['ValueLabelIds']))
				$ret .= $label->Name . ', ';
		}
		return Str::RemoveEnding($ret, ', ') . ')';
	}

	private function GetDistanceCaption($output)
	{
		if($output['HasMaxDistance'])
			return ' hasta ' . $output['MaxDistance'] . ' km';
		return '';
	}

	private function FindById($arr, $id, $isVersion = false)
	{
		foreach($arr as $i => $value)
		{
			if(($isVersion && $value->Version->Id == $id)
				|| ($isVersion == false && $value->Id == $id))
			{
				return $arr[$i];
			}
		}
		return [];
	}

}
