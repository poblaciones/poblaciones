<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\db\frontend\SnapshotMetricModel;
use helena\db\frontend\SnapshotLookupModel;
use helena\db\frontend\SnapshotSearchModel;
use helena\classes\App;
use minga\framework\Arr;
use minga\framework\SearchLog;
use minga\framework\Profiling;

class LookupService extends BaseService
{
	public function Search($query, $filter, $inBackoffice)
	{
		Profiling::BeginTimer();
		$log = new SearchLog();
		$log->BeginSearch();

		$modelMetrics = new SnapshotMetricModel();
		$modelLookup = new SnapshotSearchModel();

		// Trae los indicadores que coinciden
		if ($filter != 'r')
			$resLay = $modelMetrics->Search($query, $inBackoffice);
		else
			$resLay = [];

		// Trae las regiones
		if ($filter != 'm')
			$resClippings = $modelLookup->SearchClippingRegions($query);
		else
			$resClippings = [];

		// Si hay de ambas, pone 5 de cada uno
		$ret = array();
		for($n = 0; $n < 10; $n++)
		{
			if ($n < sizeof($resLay))
				$ret = Arr::AddAt($ret, $n, $resLay[$n]);
			if ($n < sizeof($resClippings) && sizeof($ret) !== 10)
				$ret[] = $resClippings[$n];
			if (sizeof($ret) === 10) break;
		}
		// Si no encontró, complementa con features
		if (sizeof($ret) === 0 && $filter != 'r' && $filter != 'm')
		{
			$resFeatures = $modelLookup->SearchFeatures($query);
			$this->appendResults($ret, $resFeatures, 10 - sizeof($ret));
		}
		$log->RegisterSearch($query, sizeof($ret));

		Profiling::EndTimer();
		return $ret;
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

