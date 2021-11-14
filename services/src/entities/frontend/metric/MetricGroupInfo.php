<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class MetricGroupInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Icon;
	public $Order;
	public $Intensity;

	public $Items = array();

	public static function GetMap()
	{
		return array (
			'lgr_id' => 'Id',
			'lgr_icon' => 'Icon',
			'lgr_order' => 'Order',
			'lgr_caption' => 'Name');
	}
}


