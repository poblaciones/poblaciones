<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;
use helena\services\common\DatasetDownloadManager;

class DownloadDatasetService extends BaseService
{
	public function CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity)
	{
		$dm = new DatasetDownloadManager();
		return $dm->CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, true, null);
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new DatasetDownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity)
	{
		return DatasetDownloadManager::GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, true);
	}
}

