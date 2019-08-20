<?php

namespace helena\db\admin;

use minga\framework\Profiling;
use helena\classes\App;
use helena\entities\frontend\metric\MetricGroup;


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

		$sql = "SELECT lgr_id, lgr_caption, lgr_icon, lgr_order, 
				(select count(*) from metric where mtr_metric_group_id = lgr_id) as usages FROM metric_group ORDER BY lgr_order, lgr_caption";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetList()
	{
		$list = $this->GetMetricGroupsForCombo();
		$ret = array();
		foreach($list as $key => $value)
		{
			$ret[] = array('id' => $key, 'caption' => $value);
		}
		return $ret;
	}
		public function GetObjectForEdit($metricGroupId)
	{
		if ($metricGroupId == null)
			return new MetricGroup();

		$data = $this->GetForEdit($metricGroupId);
		$ret = new MetricGroup();
		$field = $ret->Fill($data);
		return $ret;
	}
	private function GetForEdit($metricGroupId)
	{
		Profiling::BeginTimer();
		$params = array($metricGroupId);

		$sql = "SELECT * FROM metric_group WHERE lgr_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}

	public function GetMetricGroupsForCombo()
	{
		$ret = $this->GetMetricGroups();
		return $ret;
	}
}


