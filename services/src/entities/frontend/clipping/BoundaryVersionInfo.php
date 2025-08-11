<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class BoundaryVersionInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Metadata;
	public $Count = null;
	public $SelectedVersionIndex = 0;

	public static function GetMap()
	{
		return array (
			'bvr_id' => 'Id',
			'bvr_caption' => 'Name');
	}

}


