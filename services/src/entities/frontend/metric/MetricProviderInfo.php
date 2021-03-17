<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class MetricProviderInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Order;
	public $Type;

	public static function GetMap()
	{
		return array (
			'lpr_id' => 'Id',
			'lpr_order' => 'Order',
			'lpr_caption' => 'Name');
	}
}


