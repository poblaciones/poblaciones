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

class ClippingRegionService extends BaseService
{
	public function GetNewClippingRegion()
	{
		$entity = new entities\ClippingRegion();
		return $entity;
	}

	public function GetClippingRegions()
	{
		Profiling::BeginTimer();
		$regions = App::Orm()->findAll(entities\ClippingRegion::class, array('Caption' => 'ASC'));
		$ret = [];
		$this->InsertChildrenOf($regions, $ret, 0, null);
		$this->AddChildCount($ret);
		Profiling::EndTimer();
		return $ret;
	}

	private function AddChildCount(& $regions)
	{
		Profiling::BeginTimer();
		$sql = "SELECT clr_id Id,
								(SELECT COUNT(*) FROM clipping_region_item WHERE cli_clipping_region_id = clr_id) AS Count
								FROM clipping_region";
		$counts = App::Db()->fetchAll($sql);
		foreach($regions as $region)
		{
			$id = $region->getId();
			$n = Arr::IndexOfByNamedValue($counts, "Id", $id);
			$region->ChildCount = $counts[$n]['Count'];
		}
		Profiling::EndTimer();
		return $regions;
	}
	private function InsertChildrenOf($regions, &$ret, $level, $parentId)
	{
		foreach($regions as $region)
		{
			$parentObj = $region->getParent();
			if (($parentObj === null && $parentId === null) || ($parentObj !== null && $parentObj->getId() === $parentId))
			{
				$region->Level = $level;
				$ret[] = $region;
				$this->InsertChildrenOf($regions, $ret, $level + 1, $region->getId());
			}
		}
	}
	public function UpdateClippingRegion($clippingRegion)
	{
		Profiling::BeginTimer();
		App::Orm()->Save($clippingRegion);
		Profiling::EndTimer();
		return self::OK;
	}
}

