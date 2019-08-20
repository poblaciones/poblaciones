<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class MetricGroup extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Icon;
	public $Order;

	public $ParentId;

	public static function GetMap()
	{
		return array (
			'lgr_id' => 'Id',
			'lgr_caption' => 'Name',
			'lgr_icon' => 'Icon',
			'lgr_order' => 'Order');
	}
}


