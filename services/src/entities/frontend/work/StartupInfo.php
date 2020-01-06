<?php

namespace helena\entities\frontend\work;

use helena\entities\BaseMapModel;

class StartupInfo extends BaseMapModel
{
	public $Type;
	public $Center;
	public $Zoom;
	public $ClippingRegionItemId;
	public $Selected;

	public static function GetMap()
	{
		return array (
			'wst_type' => 'Type',
			'wst_zoom' => 'Zoom',
			'wst_clipping_region_item_id' => 'ClippingRegionItemId',
			'wst_clipping_region_item_selected' => 'Selected'
			);
	}
}



