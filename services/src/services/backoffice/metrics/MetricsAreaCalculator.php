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

class MetricsAreaCalculator extends MetricsBaseCalculator
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

		if($output['HasSumValue'])
		{
			$cols['sum'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'sum', 'Suma');
			if($variable->getNormalization() !== null)
				$cols['total'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'total', 'Total para normalización');
		}
		else
		{
			$this->DeleteColumn($dataset, $datasetName, 'sum');
			$this->DeleteColumn($dataset, $datasetName, 'total');
		}

		if($output['HasMinValue'])
			$cols['min'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'min', 'Mínimo');
		else
			$this->DeleteColumn($dataset, $datasetName, 'min');

		if($output['HasMaxValue'])
			$cols['max'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'max', 'Máximo');
		else
			$this->DeleteColumn($dataset, $datasetName, 'max');

		if($output['HasCount'])
			$cols['count'] = $this->CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName, 'count', 'Conteo');
		else
			$this->DeleteColumn($dataset, $datasetName, 'count');

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
		$this->CreateAffectedTempTable();

		$offset = $slice * self::STEP;
		// calcula intervalo
		$datasetTable = $dataset->getTable();
		$sourceSnapshotTable = SnapshotByDatasetModel::SnapshotTable($source['datasetTable']);
		$rangesSql = 'SELECT MIN(id) mi, MAX(id) ma FROM (SELECT id FROM ' . $datasetTable . ' WHERE ommit = 0
											ORDER BY id LIMIT ' . $offset . ', ' . self::STEP . ') as li';
		$ranges = App::Db()->fetchAssoc($rangesSql);
		// Crea los registros intermedios
		$sql = $this->CreateAffectedRecords($dataset->getTable(),
						$datasetTable,
						$this->GetDistanceColumn($dataset, $source['datasetType'], $output),
						$output, $cols, $source, $ranges);
		$created = App::Db()->fetchScalarInt($sql, array($key));

		// Actualiza el bloque
		if ($created > 0)
		{
			$sql = $this->GetUpdateQuery($datasetTable,
							$sourceSnapshotTable,
							$output, $cols, $source);
			// Listo
			App::Db()->exec($sql);
		}
		Profiling::EndTimer();

		return $slice + 1 >= $totalSlices;
	}

	private function GetDistanceColumn($dataset, $sourceType, $output)
	{
		$ret = [
			'col' => '',
			'join' => '',
			'where' => '1',
		];
		if ($dataset->getType() == 'L')
		{
			$ret['col'] = 'POINT(' . $dataset->getLongitudeColumn()->getField() . ',' . $dataset->getLatitudeColumn()->getField() . ')';
			$ret['where'] = $dataset->getLongitudeColumn()->getField() . ' IS NOT NULL AND ' . $dataset->getLatitudeColumn()->getField() . ' IS NOT NULL';
		}
		else if ($dataset->getType() == 'S')
		{
			if ($output['IsInclusionPoint'])
				$ret['col'] = 'centroid';
			else
				$ret['col'] = 'geometry';
		}
		else if ($dataset->getType() == 'D')
		{
			if ($output['IsInclusionPoint'])
				$ret['col'] = 'gei_centroid';
			else
				$ret['col'] = 'coalesce(gei_geometry_r3, gei_geometry_r2, gei_geometry_r1)';

			$ret['join'] = 'JOIN geography_item ON gei_id = geography_item_id';
		}
		else
		{
			throw new PublicException('Tipo de dataset no reconocido');
		}

		if ($output['IsInclusionPoint'])
		{
			if ($sourceType == 'S')
				$ret['aggregateFn'] = 'CoverageSnapshotShape';
			else if ($sourceType == 'D')
				$ret['aggregateFn'] = 'CoverageSnapshotGeography';
			else if ($sourceType == 'L')
				$ret['aggregateFn'] = 'CoverageSnapshotPoint';
		}
		else
		{
			if ($sourceType == 'S')
				$ret['aggregateFn'] = 'ContentOfSnapshotShape';
			else if ($sourceType == 'D')
				$ret['aggregateFn'] = 'ContentOfSnapshotGeography';
			else if ($sourceType == 'L')
				$ret['aggregateFn'] = 'ContentOfSnapshotPoint';
		}
		return $ret;
	}

	private function CreateAffectedRecords($datasetTable, $sourceSnapshotTable, $distance, $output, $cols, $source, $ranges)
	{
		if($output['IsInclusionPoint'])
			$distMts = $output['InclusionDistance'] * 1000;
		else
			$distMts = 'null';

		$update = 'SELECT SUM(' . $distance['aggregateFn'] . '(?, id, ' . $distance['col'] . ', ' . $distMts . ', null))  '
									. ' FROM ' . $datasetTable . ' '
				. $distance['join'] .
			' WHERE ' . $distance['where'] . '
				AND id >= ' . $ranges['mi'] . ' AND id <= ' . $ranges['ma'];

		return $update;
	}

	private function GetUpdateQuery($datasetTable, $sourceSnapshotTable, $output, $cols, $source)
	{
		$fields = $this->GetFieldsToUpdate($output, $cols, $source);

		$update = 'UPDATE ' . $datasetTable . ' JOIN (
				SELECT id as affectedId, ' . $this->concatFields($fields, 'get') . '
						FROM tmp_calculate_metric_affected JOIN ' . $sourceSnapshotTable . '
						ON sna_id = ana_id GROUP BY id) as t '.
					' ON affectedId = id'
			. ' SET ' . $this->concatFields($fields, 'setter') ;

		return $update;
	}
	private function concatFields($fields, $attribute)
	{
		$ret = "";
		foreach($fields as $field)
			$ret .= ", " . $field[$attribute];

		return substr($ret, 1);
	}
	private function GetFieldsToUpdate($output, $cols, $source)
	{
		$ret = [];
		if($output['HasSumValue'])
		{
			$ret[] = ['get' => 'SUM(sna_' . $source['VariableId'] . '_value) sum_value',
									'setter' => $cols['sum']['Field'] . ' = sum_value'];
			if(isset($cols['total']))
				$ret[] = ['get' => 'SUM(sna_' . $source['VariableId'] . '_total) sum_total',
									'setter' => $cols['total']['Field'] . ' = sum_total'];
		}
		if($output['HasMinValue'])
			$ret[] = ['get' => 'MIN(sna_' . $source['VariableId'] . '_value) min_value',
									'setter' => $cols['min']['Field'] . ' = min_value'];

		if($output['HasMaxValue'])
			$ret[] = ['get' => 'MAX(sna_' . $source['VariableId'] . '_value) max_value',
									'setter' => $cols['max']['Field'] . ' = max_value'];

		if($output['HasCount'])
			$ret[] = ['get' => 'COUNT(sna_' . $source['VariableId'] . '_value) count_value',
									'setter' => $cols['count']['Field'] . ' = count_value'];

		return $ret;
	}

	protected function GetCaptionContent($element)
	{
		return ' de';
	}

	public function AreaColumnExists($datasetId, $variableId)
	{
		$srcDataset = $this->GetSourceDatasetByVariableId($variableId);

		$datasetColumn = new DatasetColumnService();
		$name = $this->GetColumnName($srcDataset->getCaption(), 'count');
		return $datasetColumn->ColumnExists($datasetId, $name);
	}

}
