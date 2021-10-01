<?php

namespace helena\services\backoffice\metrics;

use minga\framework\Str;
use minga\framework\Arr;
use minga\framework\Profiling;

use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\services\backoffice\PermissionsService;
use helena\services\backoffice\publish\snapshots\Variable;

class MetricsManager
{
	public function GetColumnDistributions($datasetId, $dataColumn, $dataColumnId, $normalization, $normalizationId, $normalizationScale, $from, $to, $filter)
	{
		$ret = array();
		$data = $this->GetSortedDataForColumn($datasetId, $dataColumn, $dataColumnId, $normalization, $normalizationId, $normalizationScale, $filter);
		// Indica nulos
		$hasNulls = $this->resolveNulls($data);
		// Calcula total
		$totalPopulation = NtilesBreaks::CalculateTotalPopulation($data);
		// Calcula valores
		for($n = $from; $n <= $to; $n++)
		{
			$jenksFisher = JenksFisher::Calculate($data, $n);
			$ntilesBreaks = NtilesBreaks::Calculate($data, $n, $totalPopulation);
			$ret[$n] = array('jenks'=> $jenksFisher, 'ntiles'=> $ntilesBreaks);
		}
		$cld = new \stdClass();
		$cld->Groups = $ret;
		$count = sizeof($data);
		if ($count > 0)
		{
			$cld->MinValue = $data[0][0];
			$cld->MaxValue = $data[$count - 1][0];
		}
		else
		{
			$cld->MinValue = null;
			$cld->MaxValue = null;
		}
		$cld->HasNulls = $hasNulls;
		return $cld;
	}

	private function resolveNulls(&$data)
	{
		if (sizeof($data) > 0 && $data[0][0] === null)
		{
			array_shift($data);
			return true;
		}
		else
			return false;
	}

	private function GetSortedDataForColumn($datasetId, $dataColumn, $dataColumnId, $normalization, $normalizationId, $normalizationScale, $filter)
	{
		Profiling::BeginTimer();
		// Arma el listado agrupado de [VALOR,PESO]
		$field = $this->resolveFieldValues($datasetId, $dataColumn, $dataColumnId, $normalization, $normalizationId, $normalizationScale);
		$dataTableSql = "SELECT dat_table FROM draft_dataset WHERE dat_id = ?";
		$table = App::Db()->fetchScalar($dataTableSql, array($datasetId));
		// Se fija si tiene que hacer el join a la geografía
		$geoJoin = '';
		$hasGeoFields = Variable::HasGeoFields($dataColumn, $normalization);
		if ($hasGeoFields)
			$geoJoin = " JOIN geography_item ON gei_id = geography_item_id ";
		// Agrega el filtro
		if ($filter !== null)
			$filterWhere = " AND " . Variable::ResolveFilterCondition($datasetId, $filter);
		else
			$filterWhere = "";

		// Hace la consulta
		$sql = "SELECT " . $field . ", COUNT(*) " .
						" FROM " . $table . $geoJoin .
						" WHERE ommit = 0 " . $filterWhere .
						" GROUP BY " . $field . " ORDER BY ". $field;
		$ret = App::Db()->fetchAllByPos($sql);
		Arr::CastColumnAsFloat($ret, 0);
		Profiling::EndTimer();
		return $ret;
	}
	private function resolveFieldValues($datasetId, $dataColumn, $dataColumnId, $normalization, $normalizationId, $normalizationScale)
	{
		$sql = "SELECT (SELECT dco_field FROM draft_dataset_column WHERE dco_id = ? AND dco_dataset_id = ?) AS mvv_data_field,
									 (SELECT dco_field FROM draft_dataset_column WHERE dco_id = ? AND dco_dataset_id = ?) AS mvv_normalization_field,
									 (SELECT dat_type FROM draft_dataset WHERE dat_id = ?) as dat_type";
		$values = App::Db()->fetchAssoc($sql, array($dataColumnId, $datasetId, $normalizationId, $datasetId, $datasetId));
		$values['mvv_data'] = $dataColumn;
		$values['mvv_normalization'] = $normalization;
		$values['mvv_normalization_scale'] = $normalizationScale;
		$var = new Variable($values, $values);
		$fix = -1;
		if ($normalization !== null)
		{
			if ($normalizationScale == 1)
				$fix = 2;
			else
				$fix = 1;
		}
		return $var->CalculateNormalizedValueField($fix);
	}

	public function GetWorkMetricVersions($workId)
	{
		Profiling::BeginTimer();
		$ret = array();
		$levels = App::Orm()->findManyByQuery("SELECT l FROM e:DraftMetricVersionLevel l JOIN l.Dataset d
																	JOIN d.Work w WHERE w.Id = :p1", array($workId));
		$metricVersions = $this->GetUniquePropertiesFilter($levels, array('MetricVersion'));
		foreach($metricVersions as $version)
		{
			$locVersion = App::Orm()->Disconnect($version);
			$locVersion->Levels = $this->ExtractLevels($levels, $version);
			$ret[] = $locVersion;
		}
		self::SortVersionsByMetricAndVersion($ret);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetDatasetMetricVersionLevels($datasetId)
	{
		Profiling::BeginTimer();
		$levels = App::Orm()->findManyByProperty(entities\DraftMetricVersionLevel::class, 'Dataset.Id', $datasetId);
		$levels = App::Orm()->Disconnect($levels);

		$this->AddVariables($datasetId, $levels);
		$this->AddEditPermission($datasetId, $levels);

		self::SortLevelsByMetricAndVersion($levels);

		Profiling::EndTimer();
		return $levels;
	}

	private function AddVariables($datasetId, $levels)
	{
		Profiling::BeginTimer();
		$variables = App::Orm()->findManyByQuery("SELECT v FROM e:DraftVariable v JOIN v.MetricVersionLevel lv JOIN lv.Dataset d WHERE d.Id = :p1 ORDER BY lv.Id, v.Order", array($datasetId));
		$values = App::Orm()->findManyByQuery("SELECT l FROM e:DraftVariableValueLabel l JOIN l.Variable v JOIN v.MetricVersionLevel lv JOIN lv.Dataset d WHERE d.Id = :p1 ORDER BY lv.Id, v.Id, l.Order, l.Id", array($datasetId));

		foreach($levels as $level)
		{
			$level->Variables = $this->ExtractVariables($variables, $values, $level->Id);
			$level->ValuesChanged = false;
		}
		Profiling::EndTimer();
	}

	private function ExtractVariables($variables, $values, $levelId)
	{
		$ret = array();
		$levelVariables = $this->GetUniquePropertiesFilter($variables, array(), array('MetricVersionLevel', 'Id'), $levelId);
		foreach($levelVariables as $variable)
		{
			$locVariable = App::Orm()->Disconnect($variable);
			$locVariable->Values = $this->ExtractValues($values, $variable);
			$ret[] = $locVariable;
		}
		return $ret;
	}

	private function ExtractValues($values, $variable)
	{
		$partialValues = $this->GetUniquePropertiesFilter($values, array(), array('Variable'), $variable);
		return App::Orm()->Disconnect($partialValues);
	}

	private function ExtractLevels($levels, $version)
	{
		$partialValues = $this->GetUniquePropertiesFilter($levels, array(), array('MetricVersion'), $version);
		$ret = array();
		foreach($partialValues as $level)
		{
			$levelDisconnected = App::Orm()->Disconnect($level);
			$levelDisconnected->DatasetId = $level->getDataset()->getId();
			$levelDisconnected->MultilevelMatrix = $level->getDataset()->getMultilevelMatrix();
			$ret[] = $levelDisconnected;
		}
		return $ret;
	}

	public function GetMetricVersionLevelVariables($workId, $metricVersionLevelId)
	{
		Profiling::BeginTimer();
		$variables = App::Orm()->findManyByQuery("SELECT v FROM e:DraftVariable v JOIN v.MetricVersionLevel lv JOIN lv.Dataset d JOIN d.Work w WHERE w.Id = :p1 AND lv.Id = :p2 ORDER BY lv.Id, v.Order", array($workId, $metricVersionLevelId));
		$values = App::Orm()->findManyByQuery("SELECT l FROM e:DraftVariableValueLabel l JOIN l.Variable v JOIN v.MetricVersionLevel lv JOIN lv.Dataset d JOIN d.Work w WHERE w.Id = :p1 AND lv.Id = :p2 ORDER BY lv.Id, v.Id, l.Order, l.Id", array($workId, $metricVersionLevelId));

		$ret = $this->ExtractVariables($variables, $values, $metricVersionLevelId);

		Profiling::EndTimer();
		return $ret;
	}

	public function SortLevelsByMetricAndVersion(&$arr)
	{
		usort($arr, function($a, $b) {
			$cmp1 = Str::IntCmp($a->MetricVersion->Order, $b->MetricVersion->Order);
			if ($cmp1 !== 0)
				return $cmp1;
			else
			{
				$cmp2 = Str::CultureCmp($a->MetricVersion->Metric->Caption, $b->MetricVersion->Metric->Caption);
				if ($cmp2 !== 0)
					return $cmp2;
				else
				{
					return -1 * Str::CultureCmp($a->MetricVersion->Caption, $b->MetricVersion->Caption);
				}
			}
		});
	}

		public function SortVersionsByMetricAndVersion(&$arr)
	{
		usort($arr, function($a, $b) {
			$cmp1 = Str::IntCmp($a->Order, $b->Order);
			if ($cmp1 !== 0)
				return $cmp1;
			else
			{
				$cmp2 = Str::CultureCmp($a->Metric->Caption, $b->Metric->Caption);
				if ($cmp2 !== 0)
					return $cmp2;
				else
				{
					return -1 * Str::CultureCmp($a->Caption, $b->Caption);
				}
			}
		});
	}

	private function GetUniquePropertiesFilter($list, $properties, $filter = null, $value = null)
	{
		// Devuelve la lista con distinct por unique (en properties) y opcionalmente filtrada
		// Los filtros se indican como array de propiedades estilo array('MetricVersion', 'Metric', 'Id')
		$ret = array();
		foreach($list as $item)
		{
			if ($filter === null || $this->getSequenceValue($item, $filter) === $value)
			{
				$currentValue = $this->getSequenceValue($item, $properties);
				if (!in_array($currentValue, $ret))
					$ret[] = $currentValue;
			}
		}
		return $ret;
	}
	private function 	getSequenceValue($item, $properties)
	{
		$currentValue = $item;
		foreach($properties as $get)
		{
			$getter = 'get' . $get;
			$currentValue = $currentValue->$getter();
		}
		return $currentValue;
	}

	private function AddEditPermission($datasetId, $levels)
	{
		Profiling::BeginTimer();

		$permissionsService = new PermissionsService();
		$permissions = $permissionsService->GetMetricsCanEditForDataset($datasetId);

		foreach($levels as $level)
		{
			$metric = $level->MetricVersion->Metric;
			$metric->CanEdit = $permissions[$metric->Id];
		}
		Profiling::EndTimer();
	}

}

