<?php

namespace helena\services\frontend;

use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\common\DatasetDownloadManager;

class DownloadDatasetService extends BaseService
{
	public function CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition)
	{
		$dm = new DatasetDownloadManager();
		return $dm->CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, false, 'basic');
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new DatasetDownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $workId, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition)
	{
		Statistics::StoreDownloadDatasetHit($workId, $datasetId, $type);
		return DatasetDownloadManager::GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, $partition, false);
	}
}

