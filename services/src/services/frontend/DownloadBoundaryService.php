<?php

namespace helena\services\frontend;

use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\common\BoundaryDownloadManager;

class DownloadBoundaryService extends BaseService
{
	public function CreateMultiRequestFile($type, $boundaryVersionId, $clippingItemId, $clippingCircle)
	{
		$dm = new BoundaryDownloadManager();
		return $dm->CreateMultiRequestFile($type, $boundaryVersionId, $clippingItemId, $clippingCircle);
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new BoundaryDownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $boundaryVersionId, $clippingItemId, $clippingCircle)
	{
		//Statistics::StoreDownloadBoundaryHit($boundaryVersionId, $type);
		return BoundaryDownloadManager::GetFileBytes($type, $boundaryVersionId, $clippingItemId, $clippingCircle);
	}
}

