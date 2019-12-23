<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;

class ClippingRegionItemGeographyItemModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'cartgraphy_item';
		$this->idField = 'gei_id';
		$this->captionField = 'gei_caption';

	}

	public function GetGeographyItemId($clippingItemId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT cgi_geography_item_id FROM clipping_region_item_geography_item WHERE cgi_clipping_region_item_id = ?";
		$ret = (int)App::Db()->fetchColumn($sql, array((int)$clippingItemId));
		Profiling::EndTimer();
		return $ret;
	}
}
