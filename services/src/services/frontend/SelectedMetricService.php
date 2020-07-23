<?php

namespace helena\services\frontend;

use helena\caches\SelectedMetricsMetadataCache;
use helena\services\common\BaseService;
use helena\classes\Session;
use helena\classes\LevelZoom;
use helena\db\frontend\MetricVersionModel;
use helena\db\frontend\VariableModel;
use helena\db\frontend\VariableValueLabelModel;
use helena\entities\frontend\geometries\Envelope;
use minga\framework\ErrorException;
use minga\framework\Arr;
use minga\framework\Profiling;

use helena\entities\frontend\metric\DatasetInfo;
use helena\entities\frontend\metric\SelectedMetric;
use helena\entities\frontend\metric\SelectedMetricVersion;
use helena\entities\frontend\metric\VariableInfo;
use helena\entities\frontend\metric\LevelInfo;
use helena\entities\frontend\metric\ValueLabelInfo;

use helena\classes\SpecialColumnEnum;
use helena\classes\GlobalTimer;
use helena\classes\App;
use helena\classes\Statistics;

class SelectedMetricService extends BaseService
{
	public function PublicGetSelectedMetrics($metricsId)
	{
		$ids = explode(',', $metricsId);
		$ret = array();
		foreach($ids as $id)
		{
			if ($id != '')
			{
				$ret[] = $this->PublicGetSelectedMetric(intval($id), false, true);
			}
		}
		return $ret;
	}
	public function PublicGetSelectedMetric($metricId, $throwError = true, $filterByPermissions = false)
	{
		$ret = self::GetSelectedMetric($metricId, $throwError, $filterByPermissions, true);
		if ($ret !== null)
			Statistics::StoreSelectedMetricHit($ret);
		return $ret;
	}

	public function GetSelectedMetric($metricId, $throwError = true, $filterByPermissions = false, $filterTables = false)
	{
		$data = null;
		Profiling::BeginTimer();

		if (SelectedMetricsMetadataCache::Cache()->HasData($metricId, $data) == false)
		{
			$data = $this->CalculateSelectedMetric($metricId, $throwError);
			if ($data == null)
			{
				Profiling::EndTimer();
				return null;
			}
			SelectedMetricsMetadataCache::Cache()->PutData($metricId, $data);
			$data->EllapsedMs = GlobalTimer::EllapsedMs();
		}
		else
		{
			$data = $this->GotFromCache($data);
		}
		// Quita los que no tenga acceso
		$this->RemovePrivateVersions($data);

		Profiling::EndTimer();
		if(sizeof($data->Versions) == 0)
			return null;
		else
		{
			if ($filterTables)
			{
				$data = $this->filterTables($data);
			}
			return $data;
		}
	}
	private function filterTables($data)
	{
		foreach($data->Versions as $version)
		{
			foreach($version->Levels as $level)
				$level->Dataset->Table = null;
		}
		return $data;
	}
	private function RemovePrivateVersions($data)
	{
		for($n = sizeof($data->Versions) - 1; $n >= 0; $n--)
		{
			$version = $data->Versions[$n];
			if ($version->Version->WorkIsPrivate && (!Session::IsAuthenticated() || !Session::IsWorkReaderShardified($version->Version->WorkId)))
			{
				// Lo tiene que remover...
				Arr::RemoveAt($data->Versions, $n);
			}
		}
	}

	private function CalculateSelectedMetric($metricId, $throwError)
	{
		// Obtiene el metricInfo
		$metricService = new MetricService();

		$metric = $metricService->GetMetric($metricId, $throwError);
		if ($metric == null)
			return null;
		$selectedMetric = new SelectedMetric();
		$selectedMetric->Metric = $metric;
		$selectedMetric->Visible = true;
		$selectedMetric->ShowLegendsMetricName = true;

		$this->AddVersions($selectedMetric);

		if (sizeof($selectedMetric->Versions) == 0)
		{
			if ($throwError)
				throw new ErrorException('El indicador seleccionado no posee información.');
			else return null;
		}

		$selectedMetric->SelectedVersionIndex = sizeof($selectedMetric->Versions) - 1;

		unset($selectedMetric->Metric->Versions);

		return $selectedMetric;
	}

	private function AddVersions($selectedMetric)
	{
		foreach($selectedMetric->Metric->Versions as $versionInfo)
		{
			$version = new SelectedMetricVersion();
			$version->Version = $versionInfo;
			$this->AddLevels($version);

			$version->SymbolStackedPosition = -1;
			$version->SelectedLevelIndex = 0;

			$version->Work = $this->GetWork($version);

			if ($version->Work !== null)
				$selectedMetric->Versions[] = $version;
		}
	}

	private function GetWork($selectedVersionInfo)
	{
		$workService = new WorkService();
		return $workService->GetWorkByMetricVersion($selectedVersionInfo->Version->Id);
	}

	private function AddLevels($selectedVersionInfo)
	{
		$table = new MetricVersionModel();
		$levels = $table->GetVersionLevelsExtraInfo($selectedVersionInfo->Version->Id);
		foreach($levels as $levelRow)
		{
			$level = $this->CreateLevel($levelRow);

			// TODO: traer el caption $version->SummaryCaption = ;
			// $level->SummaryCaption = $levelRow[''];

			$level->HasDescriptions = ($levelRow['dat_caption_column_id'] != null);
			if ($level->Dataset->Type == 'L')
			{
				$level->Name = "Ubicaciones";
				$level->HasArea = false;
				$level->LevelType = 'L';
			}
			else if ($level->Dataset->Type == 'S')
			{
				$level->Name = "Zonas";
				$level->HasArea = true;
				$level->LevelType = 'S';
			}
			else if ($level->Dataset->Type == 'D')
			{
				$level->LevelType = 'D';
				$level->HasArea = true;
				if ($levelRow['geo_field_caption_name'] != null)
					$level->HasDescriptions = true;
			}
			else
				throw new ErrorException('Unknown dataset type: ' . $selectedVersionInfo->Dataset->Type);
			$selectedVersionInfo->Levels[] = $level;
		}
		// Recorre los levels quitando límites de zoom no cubiertos
		LevelZoom::RemoveZoomHoles($selectedVersionInfo);
	}

	private function CreateLevel($selectedVersionLevelInfo)
	{
		// Crea el nivel
		$level = new LevelInfo();
		$level->Fill($selectedVersionLevelInfo);
		$level->HasUrbanity = ($selectedVersionLevelInfo['geo_field_urbanity_name'] != null);
		$level->SelectedVariableIndex = 0;
		if ($selectedVersionLevelInfo['mvl_extents'])
			$level->Extents = Envelope::FromDb($selectedVersionLevelInfo['mvl_extents'])->Trim();
		$level->Dataset = new DatasetInfo();
		$level->Dataset->Fill($selectedVersionLevelInfo);
		// Agrega variables
		$this->AddVariables($level);
		return $level;
	}

	private function AddVariables(&$levelInfo)
	{
		$table = new VariableModel();
		$variables = $table->GetByVersionLevelId($levelInfo->Id);
		foreach($variables as $variable)
		{
			$variableInfo = new VariableInfo();
			$variableInfo->Fill($variable);
			$variableInfo->IsCategorical = $variable['vsy_cut_mode'] === 'V';
			$variableInfo->IsSimpleCount = $variable['mvv_normalization'] === null &&
																				($variable['mvv_data'] === SpecialColumnEnum::Count || $variable['mvv_data_column_is_categorical']);
			if ($variableInfo->IsSimpleCount)
				$variableInfo->ShowValues = false;
			$variableInfo->HasTotals = $variable['mvv_normalization'] !== null;
			$this->AddVariablesValues($variableInfo);
			if ($variableInfo->IsDefault)
				$levelInfo->SelectedVariableIndex = sizeof($levelInfo->Variables);

			$levelInfo->Variables[] = $variableInfo;

		}
	}

	public function AddVariablesValues($variableInfo)
	{
		$tableValues = new VariableValueLabelModel();
		$values = $tableValues->GetByVariableId($variableInfo->Id);

		foreach($values as $value)
		{
			$valueInfo = new ValueLabelInfo();
			$valueInfo->Fill($value);
			$valueInfo->FixColors();
			$valueInfo->FixVisible();

			$variableInfo->ValueLabels[] = $valueInfo;
		}
	}

}

