<?php

namespace helena\services\frontend;

use minga\framework\Context;
use minga\framework\Arr;
use helena\classes\Session;
use helena\classes\App;

use helena\caches\FabMetricsCache;
use helena\services\common\BaseService;
use helena\services\admin\StatisticsService;

use helena\entities\frontend\metric\MetricProviderInfo;
use helena\db\frontend\BoundaryModel;
use helena\db\frontend\SnapshotMetricModel;

class FabService extends BaseService
{
	private $intensityTarget = null;

	public function GetFabMetrics()
	{
		$shard = App::Settings()->Shard()->CurrentShard;
		$data = null;

		if (FabMetricsCache::Cache()->HasData($shard, $data))
			return self::RemovePrivateBoundaries($data);

		$data = $this->CalculateFab();

		FabMetricsCache::Cache()->PutData($shard, $data);
		return self::RemovePrivateBoundaries($data);
	}

	private function CalculateFab()
	{
		$metrics = $this->CalculateFabMetrics();
		$boundaries = $this->CalculateFabRecommendedBoundaries();

		return ['Metrics' => $metrics, 'Boundaries' => $boundaries];
	}

	private function CalculateFabMetrics()
	{
		$metricsService = new MetricService();
		$providers = $metricsService->GetMetricProviders();

		// Arma los grupos con métricas
		$ret = $this->CalculateMetrics($providers);

		// Agrega boundaries
		$boundaries = $this->GetFabBoundaries();
		if ($boundaries)
			array_unshift($ret, $boundaries);

		// Agrega los recomendados
		$recommended = $this->GetRecommended($providers);
		if ($recommended)
			array_unshift($ret, $recommended);

		return $ret;
	}


	private function CalculateFabRecommendedBoundaries()
	{
		$table = new BoundaryModel();
		return $table->GetRecommendedBoundaries();
	}
	private function IntensityTarget()
	{

	}
	private function CalculateMetrics($providers)
	{
		$ret = [];
		// Agrega métricas
		$sets = $this->GetFabMetricsGrouped();
		$metricsService = new MetricService();
		$groups = $metricsService->GetMetricGroups();
		$step = .012;
		$intensity = 1 - (sizeof($groups) * $step);
		$this->intensityTarget = $intensity - $step;

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
				$group->Intensity = $intensity;
				$intensity += $step;
				$ret[] = $group;
			}
		}
		return $ret;
	}

	private function RemovePrivateBoundaries(&$ret)
	{
		if (Session::IsSiteReader())
			return $ret;
		$boundaries = $ret->Boundaries;
		foreach($boundaries as &$group)
		{
			$secondItem = (sizeof($group['Items']) > 1 ? $group['Items'][1] : null);
			if ($secondItem)
			{
				$type = (is_array($secondItem) ? Arr::SafeGet($secondItem, 'Type', 'M') : $secondItem->Type);
				if ($type === 'B')
				{
					// las filtra
					if ($this->doRemovePrivateBoundaries($group['Items']))
						$this->fixEmptyGroups($group['Items']);
					if (sizeof($group['Items']) == 0)
						Arr::Remove($boundaries, $group);
					break;
				}
			}
		}
		return $ret;
	}
	private function fixEmptyGroups(&$items)
	{
		$groupSize = 0;
		for($n = 0; $n < sizeof($items); $n++)
		{
			if ($this->isHeader($items[$n]))
			{
				if ($groupSize == 0 && $n > 0)
				{
					Arr::RemoveAt($items, $n - 1);
					$n--;
				}
				$groupSize = 0;
			}
			else
			{
				$groupSize++;
			}
		}
		if ($groupSize == 0 && sizeof($items) > 0)
		{
			Arr::RemoveAt($items, sizeof($items) - 1);
		}
	}

	private function doRemovePrivateBoundaries(&$items)
	{
		$removedItems = false;
		for($n = sizeof($items) - 1; $n >= 0; $n--)
		{
			if (!$this->isHeader($items[$n]) &&
				!Session::IsBoundaryPublicOrAccessible($items[$n]['Id']))
			{
				Arr::RemoveAt($items, $n);
				$removedItems = true;
			}
		}
		return $removedItems;
	}

	private function isHeader($item)
	{
		return Arr::SafeGet($item, 'Header', false);
	}
	private function addSubHeaders($list)
	{
		$last = null;
		$ret = [];
		foreach($list as $metric)
		{
			if ($metric->Provider && $metric->Provider->Name !== $last)
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
	if (!is_object($a->Provider) || !is_object($b->Provider))
		return 0;

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
		$filtered = App::Settings()->Shard()->FilterItemsByPublic($items, 'myv_metric_id');
		return Arr::FromSortedToKeyed($filtered, 'myv_metric_group_id');
	}

	private function GetRecommended($providers)
	{
		$stats = new StatisticsService();
		$rows = $stats->GetLastMonthTopMetrics(10);
		if (sizeof($rows) === 0)
			return null;

		$metrics = $this->createMetricInfos($rows, $providers);
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
		return [ 'Id' => null, 'Name' => 'Los más consultados', 'Icon' => 'star',
						'Items' => $metrics, 'Intensity' => 1.05];
	}

	private function GetFabBoundaries()
	{
		$table = new BoundaryModel();
		$items = $table->GetFabBoundaries();
		$list = $this->addBoundariesSubHeaders($items);

		if (sizeof($list) === 0)
			return null;
		return [ 'Id' => null, 'Name' => 'Delimitaciones', 'Icon' => 'dashboard',
							'Items' => $list, 'Intensity' => $this->intensityTarget];
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

