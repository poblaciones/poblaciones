<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use helena\classes\App;

class MetricProviderModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'metric_provider';
		$this->idField = 'lpr_id';
		$this->captionField = 'lpr_caption';

	}

	public function GetMetricProviders()
	{
		Profiling::BeginTimer();
		$params = array();

		$sql = "SELECT lpr_id, lpr_caption, lpr_order FROM metric_provider ORDER BY lpr_order";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
}


