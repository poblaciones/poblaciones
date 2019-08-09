<?php

namespace helena\db\frontend;

use minga\framework\Profiling;
use helena\classes\App;

class MetricGroupModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'metric_group';
		$this->idField = 'lgr_id';
		$this->captionField = 'lgr_caption';

	}

	public function GetMetricGroups()
	{
		Profiling::BeginTimer();
		$params = array();

		$sql = "SELECT lgr_id, lgr_caption, lgr_icon, lgr_order FROM metric_group ORDER BY lgr_order";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
}


