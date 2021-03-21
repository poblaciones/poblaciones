<?php

namespace helena\services\frontend;

use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\common\DatasetDownloadManager;

class DownloadDatasetService extends BaseService
{
	public function CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity)
	{
		$dm = new DatasetDownloadManager();
		return $dm->CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, false, 'basic');
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new DatasetDownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $workId, $datasetId, $clippingItemId, $clippingCircle, $urbanity)
	{
		Statistics::StoreDownloadDatasetHit($workId, $datasetId, $type);
		return DatasetDownloadManager::GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, false);
	}
}

