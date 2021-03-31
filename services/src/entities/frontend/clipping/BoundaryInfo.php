<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class BoundaryInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Metadata;
	public $IsBoundary = true;
	public $Count = null;

	public static function GetMap()
	{
		return array (
			'bou_id' => 'Id',
			'bou_caption' => 'Name');
	}

}


