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
use minga\framework\PublicException;
use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\Profiling;

use helena\entities\frontend\metric\DatasetInfo;
use helena\entities\frontend\metric\MarkerInfo;
use helena\entities\frontend\metric\SelectedMetric;
use helena\entities\frontend\metric\SelectedMetricVersion;
use helena\entities\frontend\metric\VariableInfo;
use helena\entities\frontend\metric\LevelInfo;
use helena\entities\frontend\metric\ValueLabelInfo;
use helena\entities\frontend\metric\PartitionInfo;

use helena\services\backoffice\publish\snapshots\MergeSnapshotsByDatasetModel;

use helena\db\frontend\FileModel;
use helena\classes\SpecialColumnEnum;
use helena\classes\GlobalTimer;
use helena\classes\Statistics;

class SelectedMetricService extends BaseService
{
	public function PublicGetSelectedInfos($metricsId)
	{
		$ids = explode(',', $metricsId);
		$ret = array();
		$boundaryService = new BoundaryService();
		foreach($ids as $id)
		{
			if ($id != '')
			{
				if (Str::StartsWith($id, 'b'))
				{
					$ret[] = $boundaryService->GetSelectedBoundary(intval(substr($id,1)));
				}
				else
				{
					$ret[] = $this->PublicGetSelectedMetric(intval($id), false, true);
				}
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

		if ($data->SelectedVersionIndex > sizeof($data->Versions) - 1)
			$data->SelectedVersionIndex = sizeof($data->Versions) - 1;

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
				throw new PublicException('El indicador seleccionado no posee información.');
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
			$version->SelectedMultiLevelIndex = 0;
			if (sizeof($version->Levels) > 1 &&
				$version->Levels[sizeof($version->Levels) - 1]->Dataset->Type != 'D')
			{	// Es multinivel y el nivel más bajo no es tipo 'datos'
				$version->SelectedLevelIndex = sizeof($version->Levels) - 1;
			}
			$version->Work = $this->GetWork($version);

			if ($version->Work !== null)
			{
				$fileModel = new FileModel(false, $version->Work->Id);
				$icons = $fileModel->ReadWorkIcons($version->Work->Id);
				$icons = Arr::ToKeyByNamedValue($icons, "Caption", "Image");
				$version->Work->Icons = $icons;
				$selectedMetric->Versions[] = $version;
			}
		}
		$this->MarkComparableVariables($selectedMetric);
	}

	private function MarkComparableVariables($selectedMetric)
	{
		// Cuando ya tiene todas las versiones, se fijas si con comparables
		$datasets = [];
		// Arma la lista de datasets por nombre de nivel (provincia, departamento, etc)
		foreach($selectedMetric->Versions as $version)
		{
			foreach($version->Levels as $level)
			{
				if (!array_key_exists($level->Name, $datasets))
				{
					$datasets[$level->Name] = [];
				}
				$datasetId = $level->Dataset->Id;
				if (!Arr::InArrayByNamedValue($datasets[$level->Name], $datasetId, 'datasetId'))
				{
					$datasets[$level->Name][] = ['datasetId' => $datasetId, 'level' => $level];
				}
			}
		}
		$merger = new MergeSnapshotsByDatasetModel();
		foreach($datasets as $levelName => $datasetIds)
		{
			foreach ($datasetIds as $dataset)
			{
				$datasetId = $dataset['datasetId'];
				$level = $dataset['level'];
				foreach ($datasetIds as $datasetCompare)
				{
					$datasetCompareId = $datasetCompare['datasetId'];
					$levelCompare = $datasetCompare['level'];
					if ($datasetId != $datasetCompareId)
					{
						// Obtiene las variables comparables
						$variablePairs = $merger->GetComparableVariables($datasetId, $datasetCompareId, false);
						if (sizeof($variablePairs) > 0)
						{
							$this->FlagAllVariablesAsComparable($level, $variablePairs);
							$this->FlagAllVariablesAsComparable($levelCompare, $variablePairs);
						}

					}
				}
			}
		}
	}

	private function FlagAllVariablesAsComparable($level, $variablePairs)
	{
		foreach ($level->Variables as $levelVariable) {
			foreach ($variablePairs as $pair) {
				if ($levelVariable->Id === $pair[0]->Id() || $levelVariable->Id === $pair[1]->Id())
					$levelVariable->Comparable = true;
			}
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

			$level->HasDescriptions = ($levelRow['dat_caption_column_id'] != null);
			if ($level->Dataset->Type == 'L')
			{
				$level->Name = "Ubicaciones";
				$level->HasArea = false;
			}
			else if ($level->Dataset->Type == 'S')
			{
				$level->Name = "Zonas";
				$level->HasArea = true;
			}
			else if ($level->Dataset->Type == 'D')
			{
				$level->HasArea = true;
				if ($levelRow['geo_field_caption_name'] != null)
					$level->HasDescriptions = true;
			}
			else
				throw new PublicException('El tipo de dataset no es válido');
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
		$level->Dataset->HasGradient = ($selectedVersionLevelInfo['geo_gradient_id']
						&& ($level->Dataset->Type == 'S' || $level->Dataset->Type == 'D') ? 1 : 0);
		if ($level->Dataset->Type == 'L')
		{
			$level->Dataset->Marker = new MarkerInfo();
			$level->Dataset->Marker->Fill($selectedVersionLevelInfo);
		}
		$level->Partitions = $this->parsePartitions($selectedVersionLevelInfo);
		// Agrega variables
		$this->AddVariables($level);
		return $level;
	}

	private function parsePartitions($selectedVersionLevelInfo)
	{
		$name = $selectedVersionLevelInfo['dat_partition_column_caption'];
		$values = $selectedVersionLevelInfo['dat_partition_values'];
		if ($values !== null && $name !== null)
		{
			$valueList = explode("\t", $values);
			$captions = $selectedVersionLevelInfo['dat_partition_captions'];
			$captionList = explode("\t", $captions);
			$values = [];
			// devuelve
			$ret = new PartitionInfo();
			$ret->Name = $name;
			$ret->Mandatory = $selectedVersionLevelInfo['dat_partition_mandatory'] == 1;
			$ret->AllCaption = $selectedVersionLevelInfo['dat_partition_all_label'];
			if (!$ret->Mandatory)
			{
				$values[] = ['Value' => '', 'Caption' => $ret->AllCaption];
			}
			for($n = 0; $n < sizeof($valueList); $n++)
			{
				$values[] = ['Value' => $valueList[$n], 'Caption' => $captionList[$n]];
			}
			// devuelve
			$ret->Values = $values;
			return $ret;
		}
		else
		{
			return null;
		}
	}

	private function AddVariables(&$levelInfo)
	{
		$table = new VariableModel();
		$variables = $table->GetByVersionLevelId($levelInfo->Id);
		$asterisk = '*';

		foreach($variables as $variable)
		{
			$variableInfo = new VariableInfo();
			$variableInfo->Fill($variable);
			if ($variableInfo->Legend !== null && $variableInfo->Legend !== "")
			{
				$variableInfo->Asterisk = $asterisk;
				//$asterisk .= '*';
			}
			if ($variableInfo->Perimeter)
			{
				$variableInfo->ShowPerimeter = 1;
			}
			$variableInfo->IsCategorical = $variable['vsy_cut_mode'] === 'V';
			$variableInfo->IsSimpleCount = $variable['mvv_normalization'] === null &&
																				($variable['mvv_data'] === SpecialColumnEnum::Count || $variable['mvv_data_column_is_categorical']);
			if ($variableInfo->IsSimpleCount)
				$variableInfo->ShowValues = false;
			if ($variable['mvv_data'] === SpecialColumnEnum::AreaKm2)
				$variableInfo->Decimals = 2;
			if ($variable['mvv_data'] === SpecialColumnEnum::AreaKm2 || $variable['mvv_data'] === SpecialColumnEnum::AreaM2)
				$variableInfo->IsArea = true;
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

