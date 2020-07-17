<?php

namespace helena\services\frontend;

use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\common\DownloadManager;

class DownloadService extends BaseService
{
	public function CreateMultiRequestFile($type, $datasetId, $clippingItemId)
	{
		$dm = new DownloadManager();
		return $dm->CreateMultiRequestFile($type, $datasetId, $clippingItemId, false, 'basic');
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new DownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $workId, $datasetId, $clippingItemId)
	{
		Statistics::StoreDownloadDatasetHit($workId, $datasetId, $type);
		return DownloadManager::GetFileBytes($type, $datasetId, $clippingItemId, false);
	}
}

