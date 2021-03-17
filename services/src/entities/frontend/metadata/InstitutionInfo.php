<?php

namespace helena\entities\frontend\metadata;

use helena\entities\BaseMapModel;
use helena\classes\GeoJson;

class InstitutionInfo extends BaseMapModel
{
	public $Name;
	public $Web;
	public $Color;
	public $WatermarkId;

	public static function GetMap()
	{
		return array (
			'ins_caption' => 'Name',
			'ins_watermark_id' => 'WatermarkId',
			'ins_web' => 'Url',
			'ins_color' => 'Color',
		);
	}
}



