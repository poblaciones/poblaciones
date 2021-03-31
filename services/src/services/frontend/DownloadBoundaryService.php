<?php

namespace helena\services\frontend;

use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\common\BoundaryDownloadManager;

class DownloadBoundaryService extends BaseService
{
	public function CreateMultiRequestFile($type, $boundaryId, $clippingItemId, $clippingCircle)
	{
		$dm = new BoundaryDownloadManager();
		return $dm->CreateMultiRequestFile($type, $boundaryId, $clippingItemId, $clippingCircle);
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new BoundaryDownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $boundaryId, $clippingItemId, $clippingCircle)
	{
		//Statistics::StoreDownloadBoundaryHit($boundaryId, $type);
		return BoundaryDownloadManager::GetFileBytes($type, $boundaryId, $clippingItemId, $clippingCircle);
	}
}

