<?php

namespace helena\services\frontend;

use minga\framework\Context;
use minga\framework\Arr;

use helena\caches\FabMetricsCache;
use helena\services\common\BaseService;

use helena\entities\frontend\metric\MetricProviderInfo;
use helena\db\frontend\BoundaryModel;
use helena\db\frontend\SnapshotMetricModel;

class FabService extends BaseService
{
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

		// Agrega boundaries
		$boundaries = $this->GetFabBoundaries();
		if ($boundaries)
			$ret[] = $boundaries;

		// Agrega métricas
		$sets = $this->GetFabMetricsGrouped();
		$metricsService = new MetricService();
		$groups = $metricsService->GetMetricGroups();
		$providers = $metricsService->GetMetricProviders();

		foreach($groups as $group)
		{
			if (array_key_exists($group->Id, $sets))
			{
				$metrics = $this->createMetricInfos($sets[$group->Id], $providers);
				// Los ordena por provider, dejando los nulos al final
				usort($metrics, array($this, 'sortByOrderDescriptionNullAtEnd'));
				// inserta los headers
				$metrics = $this->addSubHeaders($metrics);
				// saca los provider
				foreach($metrics as $metric)
				{
					unset($metric->Provider);
				}
				// Listo
				$group->Items = $metrics;
				$ret[] = $group;
			}
		}

		return $ret;
	}

	private function addSubHeaders($list)
	{
		$last = null;
		$ret = [];
		foreach($list as $metric)
		{
			if ($metric->Provider->Name !== $last)
			{
					$separator = [ 'Id' => null, 'Name' =>
										 ($metric->Provider->Name === null ? 'Otras fuentes' : $metric->Provider->Name),
												'Header' => true ];
					$ret[] = $separator;
					$last = $metric->Provider->Name;
			}
			$metric->Type = 'M';
			$ret[] = $metric;
		}
		return $ret;
	}

	private function createMetricInfos($rows, $providers)
	{
		$metrics = array();
		$nullProvider = new MetricProviderInfo();

		$metricService = new MetricService();
		// crea los metricInfo a partir del registro de la base de datos
		foreach($rows as $metric)
		{
			$metricInfo = $metricService->CreateMetric($metric);
			// La asigna un provider
			if ($metricInfo->MetricProviderId)
				$metricInfo->Provider = Arr::GetItemByProperty($providers, 'Id', $metricInfo->MetricProviderId);
			else
				$metricInfo->Provider = $nullProvider;
			// Lo agrega
			$metrics[] = $metricInfo;
		}
		return $metrics;
	}
	private static function sortByOrderDescriptionNullAtEnd($a, $b)
	{
		// Primero define el orden...
		if ($a->Provider->Order !== $b->Provider->Order)
		{
			if ($a->Provider->Order === null) return 1;
			if ($b->Provider->Order === null) return -1;
			return ($a->Provider->Order > $b->Provider->Order ? 1 : -1);
		}
		else
		{
			if ($a->Provider->Name === $b->Provider->Name)
			{
				return strcasecmp($a->Name, $b->Name);
			}
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

	private function GetFabBoundaries()
	{
		$table = new BoundaryModel();
		$items = $table->GetFabBoundaries();
		$list = $this->addBoundariesSubHeaders($items);

		if (sizeof($list) === 0)
			return null;
		return [ 'Id' => null, 'Name' => 'Delimitaciones', 'Icon' => 'dashboard',
							'Items' => $list];
	}

	private function addBoundariesSubHeaders($list)
	{
		$last = null;
		$ret = [];
		foreach($list as $boundary)
		{
			if ($boundary['Group'] !== $last)
			{
					$separator = [ 'Id' => null, 'Name' => $boundary['Group'],
												'Header' => true ];
					$ret[] = $separator;
					$last = $boundary['Group'];
			}
			$boundary['Type'] = 'B';
			$ret[] = $boundary;
		}
		return $ret;
	}
}

