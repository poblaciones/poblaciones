<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;
use helena\classes\App;

class MetricInfo extends BaseMapModel
{
	public $Id; //  implements JsonSerializable
	public $Name;
	public $MetricGroupId;
	public $MetricProviderId;
	public $Provider;
	public $Signature;
	public $Icon;
	public $Tag;
	public $Keywords;
	public $Type;

	public $Versions = array();
	public static function GetMap()
	{
		return array (
			'mtr_id' => 'Id',
			'mtr_caption' => 'Name',
			'mtr_tag' => 'Tag',
			'mtr_icon' => 'Icon',
			'mtr_keywords' => 'Keywords',
			'mtr_metric_group_id' => 'MetricGroupId',
			'mtr_metric_provider_id' => 'MetricProviderId',
			'mvr_type' => 'Type');
	}
}


