<?php

namespace helena\services\frontend;

use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\common\DownloadManager;

class DownloadService extends BaseService
{
	public function CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity)
	{
		$dm = new DownloadManager();
		return $dm->CreateMultiRequestFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, false, 'basic');
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new DownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $workId, $datasetId, $clippingItemId, $clippingCircle, $urbanity)
	{
		Statistics::StoreDownloadDatasetHit($workId, $datasetId, $type);
		return DownloadManager::GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, false);
	}
}

