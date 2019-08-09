<?php

namespace helena\entities\frontend\geometries;

use helena\entities\BaseMapModel;

class Geometry
{
	public $data;

	public static function FromDb($field)
	{
		$ret = new Geometry();
		$ret->data = $field;
		return $ret;
	}

	public function TextSerialize()
	{
		return $this->data;
	}

}


