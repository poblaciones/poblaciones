<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\db\frontend\AddressServiceModel;
use helena\db\frontend\SnapshotSearchMetrics;
use helena\db\frontend\SnapshotSearchRegions;
use helena\db\frontend\SnapshotSearchFeatures;
use helena\classes\App;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\Context;
use minga\framework\SearchLog;
use minga\framework\Profiling;

class SearchService extends BaseService
{
	public function Search($query, $filter, $getDraftMetrics, $currentWork = null)
	{
		// $filter:
		// m = devuelve solo indicadores
		// r = devuelve solo regiones
		// null = devuelve indicadores, límites, regiones y direcciones
		// h = devuelve indicadores, límites o regiones, lo primero que coincida

		Profiling::BeginTimer();
		$log = new SearchLog();
		$log->BeginSearch();

		$metricLookup = new SnapshotSearchMetrics();
		$regionsLookup = new SnapshotSearchRegions();
		$featuresLookup = new SnapshotSearchFeatures();

		$addressLookup = new AddressServiceModel();

		$query = $this->ResolveStopWords($query);
		$query = $this->ResolveAutocomplete($query);

		// Trae los indicadores que coinciden
		if ($filter != 'r')
			$resLay = $metricLookup->SearchMetrics($query, $getDraftMetrics, ($filter !==  'm'), $currentWork);
		else
			$resLay = [];

		// Trae las regiones
		$resClippings = [];
		if ($filter != 'm' && ($filter != 'h' || sizeof($resLay) === 0))
		{
			$resClippings = $regionsLookup->SearchClippingRegions($query);
		}

		// Si hay de ambas, pone 5 máximo de cada uno
		// 1. primero los indicadores
		$totalMetrics = 10 - sizeof($resClippings);
		if ($totalMetrics < 5)
			$totalMetrics = 5;
		$ret = array();
		for ($n = 0; $n < $totalMetrics; $n++)
		{
			if ($n < sizeof($resLay))
				$ret[] = $resLay[$n];
		}
		// 2. después las regiones
		for($n = 0; $n < 10; $n++)
		{
			if ($n < sizeof($resClippings))
				$ret[] = $resClippings[$n];
			if (sizeof($ret) === 10) break;
		}

		// Si no encontró, complementa con features
		if (sizeof($ret) === 0 && $filter != 'r' && $filter != 'h' && $filter != 'm')
		{
			$resFeatures = $featuresLookup->SearchFeatures($query);

			$this->appendResults($ret, $resFeatures, 10 - sizeof($ret));

			// Si tampoco encontró, prueba con direcciones
			if (sizeof($ret) < 10 && Context::Settings()->Keys()->GoogleGeocodingKey)
			{
				$resFeatures = $addressLookup->SearchFeatures($query);
				$this->appendResults($ret, $resFeatures, 10 - sizeof($ret));
			}
		}
		// Listo
		$log->RegisterSearch($query, sizeof($ret));

		Profiling::EndTimer();
		return $ret;
	}

	private function ResolveStopWords($query)
	{
		foreach(App::Settings()->Map()->Stopwords as $stopWord)
			$query = Str::Replace(" " . $query . " ", ' ' . $stopWord . ' ', ' ');
		return trim($query);
	}

	private function ResolveAutocomplete($query)
	{
		foreach(App::Settings()->Map()->Autocomplete as $key => $value)
			$query = Str::ReplaceI($query, $key, $value);
		return $query;
	}


	private function appendResults(&$res, $append, $cut = -1)
	{
		$n = 0;
		foreach($append as $item)
		{
			$res[] = $item;
			if (++$n == $cut)
				break;
		}
	}
}

