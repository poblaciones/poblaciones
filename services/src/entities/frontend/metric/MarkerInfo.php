<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class MarkerInfo extends BaseMapModel
{
	public $Id;
	public $Type;
	public $Source;
	public $Symbol;
	public $Text;
	public $Image;
	public $Size;
	public $FixedSize;
	public $Frame;
	public $DescriptionVerticalAlignment;
	public $AutoScale;
	public $ContentId;
	public $SourceCentralMeridian;

	public static function GetMap()
	{
		return array (
			'dmk_id' => 'Id',
			'dmk_type' => 'Type',
			'dmk_source' => 'Source',
			'dmk_symbol' => 'Symbol',
			'dmk_image' => 'Image',
			'dmk_text' => 'Text',
			'dmk_description_vertical_alignment' => 'DescriptionVerticalAlignment',
			'dmk_size' => 'Size',
			'dmk_frame' => 'Frame',
			'dmk_fixed_size' => 'FixedSize',
			'dmk_source_central_meridian' => 'SourceCentralMeridian',
			'dmk_auto_scale' => 'AutoScale',
			'dmk_content_column_id' => 'ContentId');
	}

}


