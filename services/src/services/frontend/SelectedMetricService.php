<?php

namespace helena\services\frontend;

use helena\caches\SelectedMetricsMetadataCache;
use helena\services\common\BaseService;
use helena\classes\Session;
use helena\classes\LevelZoom;
use helena\db\frontend\MetricVersionModel;
use helena\db\frontend\VariableModel;
use helena\db\frontend\VariableValueLabelModel;
use helena\db\frontend\MetricModel;
use minga\framework\ErrorException;
use minga\framework\Arr;
use helena\entities\frontend\metric\DatasetInfo;
use helena\entities\frontend\metric\SelectedMetric;
use helena\entities\frontend\metric\SelectedMetricVersion;
use helena\entities\frontend\metric\VariableInfo;
use helena\entities\frontend\metric\LevelInfo;
use helena\entities\frontend\metric\ValueLabelInfo;

use helena\classes\GlobalTimer;
use helena\classes\App;
use helena\classes\Statistics;

class SelectedMetricService extends BaseService
{
	public function GetSelectedMetricJson($metricId)
	{
		return App::Json($this->GetSelectedMetric($metricId, true, true));
	}
	public function GetSelectedMetricsJson($metricsId)
	{
		return App::Json($this->GetSelectedMetrics($metricsId));
	}

	public function GetSelectedMetrics($metricsId)
	{
		$ids = explode(',', $metricsId);
		$ret = array();
		foreach($ids as $id)
		{
			if ($id != '')
			{
				$ret[] = $this->GetSelectedMetric(intval($id), false, true);
			}
		}
		return $ret;
	}

	//GetSelectedMetricByVersion

	public function GetSelectedMetric($metricId, $throwError = true, $filterByPermissions = false)
	{
		$data = null;

		if (SelectedMetricsMetadataCache::Cache()->HasData($metricId, $data) == false)
		{
			$data = $this->CalculateSelectedMetric($metricId, $throwError);
			if ($data == null)
				return null;
			SelectedMetricsMetadataCache::Cache()->PutData($metricId, $data);
			$data->EllapsedMs = GlobalTimer::EllapsedMs();
		}
		else
		{
			$data = $this->GotFromCache($data);
		}
		Statistics::StoreSelectedMetricHit($data);
		// Quita los que no tenga acceso
		$this->RemovePrivateVersions($data);
		if(sizeof($data->Versions) == 0)
			return null;
		else
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
		$level->CanSetUrbanity = ($selectedVersionLevelInfo['geo_field_urbanity_name'] != null);
		$level->SelectedVariableIndex = 0;

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

