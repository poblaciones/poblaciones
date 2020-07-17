<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;
use helena\services\common\DownloadManager;

class DownloadService extends BaseService
{
	public function CreateMultiRequestFile($type, $datasetId, $clippingItemId)
	{
		$dm = new DownloadManager();
		return $dm->CreateMultiRequestFile($type, $datasetId, $clippingItemId, true, null);
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new DownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $datasetId, $clippingItemId)
	{
		return DownloadManager::GetFileBytes($type, $datasetId, $clippingItemId,true);
	}
}

