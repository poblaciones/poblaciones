<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;
use helena\classes\App;

class MetricInfo extends BaseMapModel
{
	public $Id; //  implements JsonSerializable
	public $Name;
	public $MetricGroupId;
	public $Revision;

	public $Versions = array();
	public static function GetMap()
	{
		return array (
			'mtr_id' => 'Id',
			'mtr_caption' => 'Name',
			'mtr_metric_group_id' => 'MetricGroupId',
			'cli_caption' => 'Coverage',
			'mvr_type' => 'Type');
	}
}


