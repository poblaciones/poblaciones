<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class SelectionInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $TypeName;
	public $Location;

	public $Population;
	public $Households;
	public $Children;
	public $Metadata;
	public $AreaKm2;

	public static function GetEmpty()
	{
		$info = new SelectionInfo();

		$info->Id = 0;
		$info->Name = null;
		$info->TypeName = '';
		$info->Population = 'n/d';
		$info->Households = 'n/d';
		$info->Children = 'n/d';

		$info->AreaKm2 = 'n/d';
		return $info;
	}
}


