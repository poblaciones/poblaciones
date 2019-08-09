<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\db\frontend\DatasetItemModel;
use helena\classes\App;

class InfoWindowService extends BaseService
{
	public function GetInfo($featureId, $metricId, $metricVersionId, $levelId)
	{
		$featureId = floatval($featureId);
		$datasetModel = new DatasetItemModel();
		if ($metricId)
		{
			$selectedService = new SelectedMetricService();
			$metric = $selectedService->GetSelectedMetric($metricId);
			$version = $metric->GetVersion($metricVersionId);
			$level = $version->GetLevel($levelId);
			$datasetId = $level->Dataset->Id;
			$datasetType = $level->Dataset->Type;
			$info = $datasetModel->GetInfoByGeographyItemId($datasetId, $featureId);
		}
		else
		{
			$datasetId = intval($featureId / 0x100000000);
			$id = $featureId & 0xFFFFFFFF;
			$info = $datasetModel->GetInfoById($datasetId, $id);
		}
		return $info;
	}
}

