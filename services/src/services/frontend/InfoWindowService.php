<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\db\frontend\DatasetItemModel;
use helena\classes\Session;

class InfoWindowService extends BaseService
{
	public function GetInfo($featureId, $metricId, $metricVersionId, $levelId)
	{
		$featureId = floatval($featureId);
		$datasetModel = new DatasetItemModel();
		if ($metricId)
		{
			$selectedService = new SelectedMetricService();
			$metric = $selectedService->GetSelectedMetric($metricId, true, true);
			$version = $metric->GetVersion($metricVersionId);
			$level = $version->GetLevel($levelId);
			$datasetId = $level->Dataset->Id;
			$datasetType = $level->Dataset->Type;
			// Según el tipo de Dataset, el FID puede ser el geographyItemId o el Id en el dataset
			if ($datasetType === 'L' || $datasetType === 'S')
			{
				$id = $featureId & 0xFFFFFFFF;
				$info = $datasetModel->GetInfoById($datasetId, $id);
			}
			else
			{
				$info = $datasetModel->GetInfoByGeographyItemId($datasetId, $featureId);
			}
		}
		else
		{
			$datasetId = intval($featureId / 0x100000000);
			$id = $featureId & 0xFFFFFFFF;
			if (!Session::IsWorkPublicOrAccessibleByDataset($datasetId))
			{
				throw Session::NotEnoughPermissions();
			}
			$info = $datasetModel->GetInfoById($datasetId, $id);
		}
		return $info;
	}
}

