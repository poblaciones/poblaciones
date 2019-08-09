<?php

namespace helena\db\frontend;

use helena\classes\App;
use helena\db\frontend\ClippingRegionGeographyItemModel;
use minga\framework\Profiling;

class GeographyItemModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'cartgraphy_item';
		$this->idField = 'gei_id';
		$this->captionField = 'gei_caption';
	}


	public function GetMetadataById($geographyItemId)
	{
		Profiling::BeginTimer();
		$params = array($geographyItemId);

		$sql = "SELECT gei_id Id, gei_code Code, gei_caption Caption, geo_caption Type, geo_revision Revision ".
			"FROM geography_item, geography WHERE gei_id = ? AND gei_geography_id = geo_id LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}
}
