<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class GeoDataInfo extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;
	public $Overlap = array();
	public $Inside = array();

	public function GenerateGeoList($results)
	{
		foreach($results as $res)
		{
			$data = unpack("@4/a*", $res['value']);
			$geometry = \geoPHP::load($data, 'wkb');

			$feature = array(
				(int) $res['FID'],
				$res['name'],
				(double) $res['Summary'],
				$res['AllValues'],
				$res['AllValueIds'],
				$geometry->getGeomType(),
				$geometry->asArray());
			if ($res['Inside'])
				array_push($this->Inside, $feature);
			else
				array_push($this->Overlap, $feature);
		}
	}
}


