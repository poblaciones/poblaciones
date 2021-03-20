<?php

namespace helena\services\frontend;

use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\common\BoundaryDownloadManager;

class DownloadBoundaryService extends BaseService
{
	public function CreateMultiRequestFile($type, $boundaryId)
	{
		$dm = new BoundaryDownloadManager();
		return $dm->CreateMultiRequestFile($type, $boundaryId);
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new BoundaryDownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $boundaryId)
	{
		//Statistics::StoreDownloadBoundaryHit($boundaryId, $type);
		return BoundaryDownloadManager::GetFileBytes($type, $boundaryId);
	}
}

