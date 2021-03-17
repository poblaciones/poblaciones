<?php

namespace helena\services\frontend;

use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\common\DownloadManager;

class DownloadBoundaryService extends BaseService
{
	public function CreateMultiRequestDatasetFile($type, $boundaryId)
	{
		$dm = new DownloadManager();
		return $dm->CreateMultiRequestBoundaryFile($type, $boundaryId, 'basic');
	}

	public function StepMultiRequestFile($key)
	{
		$dm = new DownloadManager();
		return $dm->StepMultiRequestFile($key);
	}

	public static function GetFileBytes($type, $boundaryId)
	{
		Statistics::StoreDownloadBoundaryHit($boundaryId, $type);
		return DownloadManager::GetBoundaryFileBytes($type, $boundaryId);
	}
}

