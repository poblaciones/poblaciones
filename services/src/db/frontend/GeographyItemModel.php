<?php

namespace helena\db\frontend;

use helena\classes\App;
use helena\db\frontend\ClippingRegionItemGeographyItemModel;
use minga\framework\Profiling;
use minga\framework\Str;

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

	/**
	 * Código, nombre y nombre de la unidad superior de ítems de geografía: [id => registro].
	 */
	public function GetNamesByIds($geographyItemIds)
	{
		Profiling::BeginTimer();
		$ret = [];
		foreach (array_chunk($geographyItemIds, 1000) as $chunk)
		{
			$sql = "SELECT item.gei_id Id, item.gei_code Code, item.gei_caption Caption, parent.gei_caption ParentCaption
						FROM geography_item item
						LEFT JOIN geography_item parent ON parent.gei_id = item.gei_parent_id
						WHERE item.gei_id IN (" . Str::JoinInts($chunk) . ")";
			foreach (App::Db()->fetchAll($sql) as $row)
			{
				$ret[intval($row['Id'])] = $row;
			}
		}
		Profiling::EndTimer();
		return $ret;
	}
}
