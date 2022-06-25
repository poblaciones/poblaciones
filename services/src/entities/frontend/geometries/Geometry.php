<?php

namespace helena\entities\frontend\geometries;

use helena\classes\GeoJson;

class Geometry
{
	public $features;
	public $projected = false;
	public $type;

	public static function FromDb($field, $fid = -1)
	{
		$args = array(array('name'=>'', 'value' => $field, 'FID' => $fid));

		$geo = new GeoJson();
		$canvas = $geo->GenerateFromBinary($args);

		$ret = new Geometry();
		$ret->features = $canvas['features'];
		$ret->type = $canvas['type'];
		return $ret;
	}


}


