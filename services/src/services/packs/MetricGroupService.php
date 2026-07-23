<?php

namespace helena\services\packs;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\Profiling;
use helena\services\backoffice\publish\CacheManager;

class MetricGroupService extends BaseService
{
	public function GetNewMetricGroup()
	{
		$entity = new entities\MetricGroup();
		return $entity;
	}

	public function GetMetricGroups()
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findAll(entities\MetricGroup::class, array('Caption' => 'ASC'));
		Profiling::EndTimer();
		return $ret;
	}

	public function UpdateMetricGroup($metricGroup)
	{
		Profiling::BeginTimer();
		App::Orm()->Save($metricGroup);
		$cacheManager = new CacheManager();
		$cacheManager->CleanMetricGroupsMetadataCache();
		Profiling::EndTimer();
		return self::OK;
	}

	public function DeleteMetricGroup($metricGroup)
	{
		Profiling::BeginTimer();
		App::Orm()->delete($metricGroup);
		$cacheManager = new CacheManager();
		$cacheManager->CleanMetricGroupsMetadataCache();
		Profiling::EndTimer();
		return self::OK;
	}
}
