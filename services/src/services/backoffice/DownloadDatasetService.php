<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;
use helena\services\common\DownloadManager;

class DownloadDatasetService extends BaseService
{
	public function CreateMultiRequestDatasetFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity)
	{
		$dm = new DownloadManager();
		return $dm->CreateMultiRequestDatasetFile($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, true, null);
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new DownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity)
	{
		return DownloadManager::GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity, true);
	}
}

