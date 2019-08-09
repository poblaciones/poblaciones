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
	private $query;
	private $modelLookup;
	private $modelMetrics;

	public function __construct($query)
	{
		$this->modelMetrics = new SnapshotMetricModel();
		$this->modelLookup = new SnapshotLookupModel();
		$this->query = $query;
	}

	public function Search()
	{
		Profiling::BeginTimer();
		SearchLog::BeginSearch();

		$resLay = $this->modelMetrics->Search($this->query);
		$resClippings = $this->modelLookup->Search($this->query, 'C');
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
		if (sizeof($ret) === 0)
		{
			$resFeatures = $this->modelLookup->Search($this->query, 'F');
			$this->appendResults($ret, $resFeatures, 10 - sizeof($ret));
		}
		SearchLog::RegisterSearch($this->query, sizeof($ret));

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

