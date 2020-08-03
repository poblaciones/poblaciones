<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class SelectionInfo extends BaseMapModel
{
	public $Regions = array();

	public $Population;
	public $Households;
	public $Children;
	public $AreaKm2;

	public static function GetEmpty()
	{
		$info = new SelectionInfo();

		$info->Population = 'n/d';
		$info->Households = 'n/d';
		$info->Children = 'n/d';

		$info->AreaKm2 = 'n/d';
		return $info;
	}
}


