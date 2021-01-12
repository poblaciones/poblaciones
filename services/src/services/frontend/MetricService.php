<?php

namespace helena\services\frontend;

use minga\framework\Context;
use minga\framework\Arr;

use helena\caches\MetricGroupsMetadataCache;
use helena\caches\MetricProvidersMetadataCache;
use helena\caches\FabMetricsCache;
use helena\services\common\BaseService;
use minga\framework\PublicException;

use helena\entities\frontend\metric\MetricVersionInfo;
use helena\entities\frontend\metric\MetricInfo;
use helena\entities\frontend\metric\MetricProviderInfo;
use helena\entities\frontend\metric\MetricGroupInfo;
use helena\db\frontend\MetricGroupModel;
use helena\db\frontend\MetricProviderModel;
use helena\db\frontend\SnapshotMetricModel;


use helena\classes\App;

class MetricService extends BaseService
{
	public function GetMetricGroups()
	{
		$shard = Context::Settings()->Shard()->CurrentShard;
		$data = null;

		if (MetricGroupsMetadataCache::Cache()->HasData($shard, $data))
			return $data;

		$data = $this->CalculateMetricGroups();

		MetricGroupsMetadataCache::Cache()->PutData($shard, $data);
		return $data;
	}
	public function GetMetricProviders()
	{
		$shard = Context::Settings()->Shard()->CurrentShard;
		$data = null;

		if (MetricProvidersMetadataCache::Cache()->HasData($shard, $data))
			return $data;

		$data = $this->CalculateMetricProviders();

		MetricProvidersMetadataCache::Cache()->PutData($shard, $data);
		return $data;
	}

	public function GetFabMetrics()
	{
		$shard = Context::Settings()->Shard()->CurrentShard;
		$data = null;

		if (FabMetricsCache::Cache()->HasData($shard, $data))
			return $data;

		$data = $this->CalculateFabMetrics();

		FabMetricsCache::Cache()->PutData($shard, $data);
		return $data;
	}

	private function CalculateFabMetrics()
	{
		$ret = array();
		$sets = $this->GetFabMetricsGrouped();
		$groups = $this->GetMetricGroups();
		$providers = $this->GetMetricProviders();
		$nullProvider = new MetricProviderInfo();

		foreach($groups as $group)
		{
			if (array_key_exists($group->Id, $sets))
			{
				$metrics = array();
				// crea los metricInfo a partir del registro de la base de datos
				foreach($sets[$group->Id] as $metric)
				{
					$metricInfo = $this->CreateMetric($metric);
					// La asigna un provider
					if ($metricInfo->MetricProviderId)
						$metricInfo->Provider = Arr::GetItemByProperty($providers, 'Id', $metricInfo->MetricProviderId);
					else
						$metricInfo->Provider = $nullProvider;
					// Lo agrega
					$metrics[] = $metricInfo;
				}
				// Los ordena por provider, dejando los nulos al final
				usort($metrics, array($this, 'sortByOrderDescriptionNullAtEnd'));
				// cambia objetos por name
				foreach($metrics as $metric)
				{
					if ($metric->Provider)
						$metric->Provider = $metric->Provider->Name;
				}
				// Listo
				$group->Metrics[] = $metrics;
				$ret[] = $group;
			}
		}
		return $ret;
	}
	private static function sortByOrderDescriptionNullAtEnd($a, $b)
	{
		// Primero define el orden...
		if ($a->Provider->Order !== $a->Provider->Order)
		{
			if ($a->Provider->Name === null) return 1;
			if ($b->Provider->Name === null) return -1;
			return ($a->Provider->Order > $b->Provider->Order ? 1 : -1);
		}
		else
		{
			if ($a->Provider->Name === null) return 1;
			if ($b->Provider->Name === null) return -1;
			return strcasecmp($a->Provider->Name, $b->Provider->Name);
		}
	}
	private function GetFabMetricsGrouped()
	{
		$table = new SnapshotMetricModel();
		$items = $table->GetFabMetricSnapshot();
		$filtered = Context::Settings()->Shard()->FilterItemsByPublic($items, 'myv_metric_id');
		return Arr::FromSortedToKeyed($filtered, 'myv_metric_group_id');
	}

	private function CalculateMetricGroups()
	{
		$groupsTable = new MetricGroupModel();
		$groups = $groupsTable->GetMetricGroups();
		$ret = array();
		foreach($groups as $group)
		{
			$groupInfo = new MetricGroupInfo();
			$groupInfo->Fill($group);
			$ret[] = $groupInfo;
		}
		return $ret;
	}

	private function CalculateMetricProviders()
	{
		$providersTable = new MetricProviderModel();
		$providers = $providersTable->GetMetricProviders();
		$ret = array();
		foreach($providers as $provider)
		{
			$providerInfo = new MetricProviderInfo();
			$providerInfo->Fill($provider);
			$ret[] = $providerInfo;
		}
		return $ret;
	}

	public function GetMetric($metricId, $errorOnNotFound = true)
	{
		$model = new SnapshotMetricModel();
		$item = $model->GetMetric($metricId);
		if ($item == null)
		{
			if ($errorOnNotFound)
				throw new PublicException("El indicador no existe en la base de datos.");
			else
				return null;
		}

		return $this->CreateMetric($item);
	}

	private function CreateMetric($item)
	{
		$metric = new MetricInfo();
		$metric->Id = $item['myv_metric_id'];
		$metric->Name = $item['myv_metric_caption'];
		$metric->MetricGroupId = $item['myv_metric_group_id'];
		$metric->MetricProviderId = $item['myv_metric_provider_id'];
		$metric->Signature = $item['myv_metric_revision'];
		$this->AddVersions($metric, $item);
		return $metric;
	}

	private function AddVersions($metric, $item)
	{

		$ids = explode("\t", $item['myv_version_ids']);
		$captions = explode("\t", $item['myv_version_captions']);
		$coverages = explode("\t", $item['myv_version_partial_coverages']);
		$workIds = explode("\t", $item['myv_work_ids']);
		$works = explode("\t", $item['myv_work_captions']);
		$isPrivate = explode("\t", $item['myv_work_is_private']);
		for($n = 0; $n < sizeof($ids); $n++)
		{
			$version = new MetricVersionInfo();
			$version->Id = intval($ids[$n]);
			$version->Name = $captions[$n];
			$version->PartialCoverage = $coverages[$n];
			if ($version->PartialCoverage == '')
				$version->PartialCoverage = null;
			$version->Work = $works[$n];
			$version->WorkId = intval($workIds[$n]);
			$version->WorkIsPrivate = intval($isPrivate[$n]);

			$metric->Versions[] = $version;
		}
		Arr::SortByField($metric->Versions, 'Name');
	}
}

