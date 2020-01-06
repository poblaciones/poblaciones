<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\db\frontend\SnapshotMetricModel;
use helena\db\frontend\SnapshotLookupModel;
use helena\classes\App;
use minga\framework\SearchLog;
use minga\framework\Profiling;

class LookupService extends BaseService
{
	public function __construct()
	{
	}

	public function Search($query, $filter)
	{
		Profiling::BeginTimer();
		SearchLog::BeginSearch();

		$modelMetrics = new SnapshotMetricModel();
		$modelLookup = new SnapshotLookupModel();

		if ($filter != 'r')
			$resLay = $modelMetrics->Search($query);
		else
			$resLay = [];

		$resClippings = $modelLookup->Search($query, 'C');
		$ret = array();
		if (sizeof($resClippings) >= 5)
			$this->appendResults($ret, $resLay, 5);
		else
			$this->appendResults($ret, $resLay);
		if (sizeof($resLay) >= 5)
			$this->appendResults($ret, $resClippings, 5);
		else
			$this->appendResults($ret, $resClippings);
		// Si no encontró, complementa con features
		if (sizeof($ret) === 0 && $filter != 'r')
		{
			$resFeatures = $modelLookup->Search($query, 'F');
			$this->appendResults($ret, $resFeatures, 10 - sizeof($ret));
		}
		SearchLog::RegisterSearch($query, sizeof($ret));

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

