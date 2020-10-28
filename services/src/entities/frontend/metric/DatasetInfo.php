<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class DatasetInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Type;
	public $Symbol;
	public $ScaleSymbol;
	public $ShowInfo;
	public $Table;
	public $TextureId;
	public $HasGradient;

	public static function GetMap()
	{
		return array (
			'dat_id' => 'Id',
			'dat_type' => 'Type',
			'dat_symbol' => 'Symbol',
			'dat_scale_symbol' => 'ScaleSymbol',
			'dat_caption' => 'Name',
			'dat_table' => 'Table',
			'dat_texture_id' => 'TextureId',
			'dat_show_info' => 'ShowInfo');
	}

}


