<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class BoundaryInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Metadata;
	public $IsBoundary = true;
	public $Count;

	public static function GetMap()
	{
		return array (
			'bou_id' => 'Id',
			'item_count' => 'Count',
			'bou_caption' => 'Name');
	}

}


