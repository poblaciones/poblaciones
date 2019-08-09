<?php

namespace helena\services\frontend;

use minga\framework\Context;
use minga\framework\Arr;

use helena\caches\MetricGroupsMetadataCache;
use helena\caches\FrameMetricsHashCache;
use helena\caches\MetricHashesListCache;
use helena\caches\FabMetricsCache;
use helena\services\common\BaseService;
use minga\framework\ErrorException;

use helena\entities\frontend\metric\MetricInfo;
use helena\entities\frontend\metric\MetricVersionInfo;
use helena\entities\frontend\metric\MetricGroupInfo;
use helena\entities\frontend\metric\MetricsList;
use helena\entities\frontend\work\WorkInfo;

use helena\entities\frontend\work\SourceInfo;

use helena\db\frontend\WorkModel;
use helena\db\frontend\MetricGroupModel;
use helena\db\frontend\SnapshotMetricModel;


use helena\classes\App;

class MetricService extends BaseService
{
	public function GetFabMetricsJson()
	{
		return App::Json($this->GetFabMetrics());
	}

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

		foreach($groups as $group)
		{
			if (array_key_exists($group->Id, $sets))
			{
				foreach($sets[$group->Id] as $metric)
					$group->Metrics[] = $this->CreateMetric($metric);

				$ret[] = $group;
			}
		}
		return $ret;
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

	public function GetMetrics($frame, $previousmetricHash)
	{
		$metricsList = null;
		$metricHash= null;

		$frameSerialized = $frame->GetKeyNoFeature();
		if (!FrameMetricsHashCache::Cache()->HasData($frameSerialized, $metricHash))
		{
			$metricsList = $this->CalculateMetricsList($frame);
			$metricHash = $metricsList->Hash;
			FrameMetricsHashCache::Cache()->PutData($frameSerialized, $metricHash);
			MetricHashesListCache::Cache()->PutDataIfMissing($metricHash, $metricsList);
		}
		// Compara con el hash del anterior
		if ($metricHash == $previousmetricHash)
			return null;

		// Si no tiene nada del anterior o son diferentes, tiene que devolver
		// los valores.
		if ($metricsList == null)
		{
			if (!MetricHashesListCache::Cache()->HasData($metricHash, $metricsList))
			{
				$metricsList = $this->CalculateMetricsList($frame);
				if ($metricsList->Hash != $metricHash)
					FrameMetricsHashCache::Cache()->PutData($frameSerialized, $metricsList->Hash);

				MetricHashesListCache::Cache()->PutData($metricsList->Hash, $metricsList);
			}
		}
		return $metricsList;
	}


	private function CalculateMetricsList($frame)
	{
		$list = new MetricsList();

		$table = new SnapshotMetricModel();

		$items = $table->GetMetricSnapshotByFrame($frame);

		foreach($items as $item)
			if (Context::Settings()->Shard()->IsValidPublicShardLow($item['myv_metric_id']))
				$list->Metrics[] = $this->CreateMetric($item);

		$list->CalculateHash();
		return $list;
	}

	public function GetMetric($metricId, $errorOnNotFound = true)
	{
		$table = new SnapshotMetricModel();

		$item = $table->GetByMetricId($metricId);
		if ($item == null)
		{
			if ($errorOnNotFound)
				throw new ErrorException("El indicador no existe en la base de datos.");
			else
				return null;
		}

		return $this->CreateMetric($item);
	}

	private function CreateMetric($item)
	{
		$metric = new MetricInfo();
		$metric->Id = $item['myv_metric_id'];
		$metric->Name = $item['myv_caption'];
		$metric->MetricGroupId = $item['myv_metric_group_id'];
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
		for($n = 0; $n < sizeof($ids); $n++)
		{
			$version = new MetricVersionInfo();
			$version->Id = $ids[$n];
			$version->Name = $captions[$n];

			$version->PartialCoverage = $coverages[$n];
			if ($version->PartialCoverage == '')
				$version->PartialCoverage = null;
			$version->Work = $works[$n];
			$version->WorkId = $workIds[$n];

			$metric->Versions[] = $version;
		}
		Arr::SortByField($metric->Versions, 'Name');
	}
}

