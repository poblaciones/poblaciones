<?php

namespace helena\services\admin;

use helena\caches\WorkPermissionsCache;
use helena\classes\App;
use helena\classes\Account;
use minga\framework\Arr;

use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\services\backoffice\PermissionsService;
use minga\framework\Profiling;
use helena\services\backoffice\publish\CacheManager;
use helena\classes\VersionUpdater;

class BoundaryService extends BaseService
{
	public function GetNewBoundary()
	{
		$entity = new entities\Boundary();
		return $entity;
	}

	public function GetBoundaries()
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findAll(entities\Boundary::class, array('Caption' => 'ASC'));
		$this->AddContent($ret);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetBoundaryGroups()
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findAll(entities\BoundaryGroup::class, array('Caption' => 'ASC'));
		Profiling::EndTimer();
		return $ret;
	}
	private function AddContent(& $boundaries)
	{
		Profiling::BeginTimer();
		$sql = "SELECT bcr_boundary_id Id,
								GROUP_CONCAT(clr_caption SEPARATOR ', ') AS clippingRegions
								FROM boundary_clipping_region JOIN clipping_region ON clr_id = bcr_clipping_region_id
								GROUP BY bcr_boundary_id";
		$counts = App::Db()->fetchAll($sql);
		foreach($boundaries as $boundary)
		{
			$id = $boundary->getId();
			$n = Arr::IndexOfByNamedValue($counts, "Id", $id);
			if ($n !== -1)
				$boundary->ClippingRegions = $counts[$n]['clippingRegions'];
		}
		Profiling::EndTimer();
		return $boundaries;
	}
	public function UpdateBoundary($boundary)
	{
		Profiling::BeginTimer();

		$metadata = $boundary->getMetadata();
		if ($metadata != null)
		{
			if (!$boundary->getId())
			{
				$metadata->setCreate(new \DateTime());
			}
			$metadata->setUpdate(new \DateTime());
			App::Orm()->Save($metadata);
		}
		App::Orm()->Save($boundary);
		$cacheManager = new CacheManager();
		$cacheManager->CleanBoundariesCache();
		VersionUpdater::Increment('FAB_METRICS');
		$cacheManager->CleanFabMetricsCache();

		Profiling::EndTimer();
		return self::OK;
	}
}

