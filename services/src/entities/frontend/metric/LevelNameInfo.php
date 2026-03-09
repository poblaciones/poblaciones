<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class LevelNameInfo extends BaseMapModel
{
	public $Id;
	public $Name;

	public $Variables = [];

	public static function GetMap()
	{
		return array ();
	}
}


