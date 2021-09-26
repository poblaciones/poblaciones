<?php

namespace helena\services\backoffice\metrics;

use minga\framework\Log;
use minga\framework\PublicException;
use minga\framework\Profiling;
use minga\framework\Str;

use helena\classes\App;
use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;
use helena\entities\backoffice as entities;
use helena\services\backoffice\DatasetColumnService;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\services\frontend\SelectedMetricService;
use helena\services\backoffice\MetricService;


abstract class MetricsBaseCalculator
{
	protected const STEP = 1000;

	abstract protected function GetCaptionContent($element);

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

	public function StepCreateMetrics($datasetId, $cols, $source)
	{
		Profiling::BeginTimer();

		$metricService = new MetricService();

		$metricColumns = ['distance', 'count', 'sum', 'min', 'max'];
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);

		$ret = [];
		foreach($cols as $column => $col)
		{
			if (in_array($column, $metricColumns))
			{
				// Crea la variable default
				$variable = $metricService->GetNewVariable();
				$variable->setIsDefault(false);
				$variable->setDataColumnIsCategorical(false);
				$variable->setCaption($col['Caption']);
				$dataColumn = App::Orm()->find(entities\DraftDatasetColumn::class, $col['Id']);
				$variable->setData('O');
				$variable->setDataColumn($dataColumn);
				// Normalization
				if ($column === 'sum' && array_key_exists('total', $cols))
				{
					$normalizationColumn = App::Orm()->find(entities\DraftDatasetColumn::class, $col['total']);
					$variable->setNormalization('O');
					$variable->setNormalizationColumn($normalizationColumn);
					$originalVariable = App::Orm()->find(entities\Variable::class, $source['VariableId']);
					$variable->setNormalizationScale($originalVariable->getNormalizationScale());
				}
				$caption = $variable->getCaption();
				$caption = substr($caption, 0, 150);
				$metricService->CreateMetricByVariable($dataset, $caption, $variable);

				$ret[] = $variable->getId();
 			}
		}
		Profiling::EndTimer();
		return $ret;
	}

	protected function CreateColumn($metric, $variable, $source, $output, $dataset, $datasetName,
			$calculatedField, $caption, $decimals = 2, $colWidth = 11, $fieldWidth = 11, $format = Format::F)
	{
		$datasetColumn = new DatasetColumnService();
		$name = $this->GetColumnName($datasetName, $calculatedField);
		$label = $this->GetColumnCaption($metric, $variable, $source, $output, $caption, $dataset);

		$col = $datasetColumn->GetColumnByVariable($dataset->getId(), $name);
		if($col == null)
		{
			$showCaption = ($label === null || trim($label) === "" ? $name : $label);
			$field = $datasetColumn->resolveStandardFieldName($dataset->getId());
			$col = $datasetColumn->CreateColumnFromFields($dataset, $field, $name,
				$showCaption, $label, $colWidth, $fieldWidth, $decimals, $format,
				Measurement::Nominal, Alignment::Left, true, true);
		}
		else
		{
			if($col->getLabel() != $label)
				$datasetColumn->UpdateLabel($col, $label);
			// vacía los valores
			$datasetColumn->ResetColumnValues($dataset, $col);
		}
		return $col;
	}

	protected function DeleteColumn($dataset, $datasetName, $calculatedField)
	{
		$datasetColumn = new DatasetColumnService();
		$name = $this->GetColumnName($datasetName, $calculatedField);
		$datasetColumn->DeleteColumn($dataset->getId(), $name);
	}


	protected function GetMetricElements($source)
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

	public function GetSourceDatasetByVariableId($variableId)
	{
		$variable = App::Orm()->find(entities\Variable::class, $variableId);
		$versionLevel = $variable->getMetricVersionLevel();
		return $versionLevel->getDataset();
	}

	private function GetValueLabelsWhere($source)
	{
		if(count($source['ValueLabelIds']) > 0)
			return ' AND sna_' . $source['VariableId'] . '_value_label_id IN (' . Str::JoinInts($source['ValueLabelIds']) . ')';
		else
			return '';
	}

	private function GetSourceFilterWhere($source)
	{
			return ' AND sna_' . $source['VariableId'] . '_total IS NOT NULL ';
	}

	private function ResetCols($datasetTable, $cols)
	{
		Profiling::BeginTimer();
		$colNames = "";
		foreach($cols as $key => $col)
			$colNames .= ", " . $col['Field'] . " = null";

		$update = 'UPDATE ' . $datasetTable . '
								SET ' . substr($colNames, 2) . ' = null';
		$ret = App::Db()->exec($update);

		Profiling::EndTimer();

		return $ret;
	}


	protected function CreateTempTable($source, $dataset)
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
									WHERE 1 ' . $this->GetSourceFilterWhere($source) . $this->GetValueLabelsWhere($source);

		Log::AppendExtraInfo($create);
		Log::AppendExtraInfo($insert);

		App::Db()->execDDL($create);
		App::Db()->exec($insert);

		Profiling::EndTimer();
	}

	protected function CreateAffectedTempTable()
	{
		Profiling::BeginTimer();

		$create = 'CREATE TEMPORARY TABLE tmp_calculate_metric_affected (id int(11) not null, ana_id int(11) not null) ENGINE=MYISAM';

		App::Db()->execDDL($create);

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

	protected function GetColumnName($datasetName, $srcColumnName, $maxLength = 64)
	{
		// El máximo de un nombre de columna en mysql es 64 por
		// eso el default de $maxLength = 64.
		$clean = Str::RemoveAccents($datasetName);
		$clean = Str::RemoveNonAlphanumeric($clean);
		$clean = Str::Replace($clean, ' ', '_');
		$len = Str::Length($clean) + Str::Length($srcColumnName) + 1;
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

		return $clean . '_' . $srcColumnName;
	}

	private function GetColumnCaption($metric, $variable, $source, $output, $caption, $dataset, $maxLength = 255)
	{
		// - Distancia a radios con Hogares con al menos un indicador de NBI (2010) (> 10%, > 25%) [hasta 25 km]
		// - Valor de radios con Hogares con al menos un indicador de NBI (2010) (> 10%, > 25%) [hasta 25 km]
		// - Latitud de radios con Hogares con al menos un indicador de NBI (2010) (> 10%, > 25%) [hasta 25 km]

		$str = $caption . $this->GetCaptionContent($caption)
			. $this->GetVariableName($metric, $variable)
			. $this->GetValueLabelsCaption($metric, $source);
		$dist = $this->GetDistanceCaption($output);
		$str .= $dist;

		if ($dist != '')
			$str .= " de ";
		else if (isset($output['IsInclusionPoint']) && !$output['IsInclusionPoint'])
			$str .= " en ";
		else
			$str .= " desde ";
		$str .= $dataset->getCaption();

		return Str::Ellipsis($str, $maxLength);
	}

	private function GetLevelName($metric)
	{
		if(count($metric['version']->Levels) > 1)
			return $metric['level']->Name;
		return '';
	}

	private function GetVariableName($metric, $variable)
	{
		if($variable->getData() == 'O')
		{
			// Si tiene la apertura de "por", la incluye solamente si se usaron filtros
			if ($variable->getSymbology()->getCutMode() == 'V')
				return ' ' . $variable->getSymbology()->getCutColumn()->getCaption();
			else
				return ' ' . $variable->getCaption();
		}
		else
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
		$level = $this->GetLevelName($metric);
		if ($level != '')
			$ret .= 'en ' . $level . ' con ';
		$toAdd = [];
		foreach($metric['variable']->ValueLabels as $label)
		{
			if(in_array($label->Id, $source['ValueLabelIds']))
				$toAdd[] = $label->Name;
		}
		for($n = 0; $n < sizeof($toAdd); $n++)
		{
			if ($n === sizeof($toAdd) - 1)
				$ret .= $toAdd[$n];
			else if ($n === sizeof($toAdd) - 2)
				$ret .= $toAdd[$n] . ' y ';
			else
				$ret .= $toAdd[$n] . ', ';
		}
		return $ret . ')';
	}

	private function GetDistanceCaption($output)
	{
		if(isset($output['HasMaxDistance']) && $output['HasMaxDistance'])
			return ' hasta ' . $output['MaxDistance'] . ' km';
		else if(isset($output['IsInclusionPoint']) && $output['IsInclusionPoint'])
			return ' hasta ' . $output['InclusionDistance'] . ' km';
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
