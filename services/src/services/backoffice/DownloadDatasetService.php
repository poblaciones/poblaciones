<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;
use helena\services\common\DatasetDownloadManager;

class DownloadDatasetService extends BaseService
{
	public function CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition)
	{
		$dm = new DatasetDownloadManager();
		return $dm->CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, true, null);
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new DatasetDownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition)
	{
		return DatasetDownloadManager::GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, true);
	}
}

