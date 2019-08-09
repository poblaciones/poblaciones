<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class DatasetInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Type;
	public $Symbol;

	public static function GetMap()
	{
		return array (
			'dat_id' => 'Id',
			'dat_type' => 'Type',
			'dat_symbol' => 'Symbol',
			'dat_caption' => 'Name');
	}

}


