<?php

namespace helena\services\packs;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use minga\framework\Profiling;
use helena\services\backoffice\publish\CacheManager;

class MetricProviderService extends BaseService
{
	public function GetNewMetricProvider()
	{
		$entity = new entities\MetricProvider();
		return $entity;
	}

	public function GetMetricProviders()
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->findAll(entities\MetricProvider::class, array('Caption' => 'ASC'));
		Profiling::EndTimer();
		return $ret;
	}

	public function UpdateMetricProvider($metricProvider)
	{
		Profiling::BeginTimer();
		App::Orm()->Save($metricProvider);
		$cacheManager = new CacheManager();
		$cacheManager->CleanMetricProvidersMetadataCache();
		Profiling::EndTimer();
		return self::OK;
	}

	public function DeleteMetricProvider($metricProvider)
	{
		Profiling::BeginTimer();
		App::Orm()->delete($metricProvider);
		$cacheManager = new CacheManager();
		$cacheManager->CleanMetricProvidersMetadataCache();
		Profiling::EndTimer();
		return self::OK;
	}
}
