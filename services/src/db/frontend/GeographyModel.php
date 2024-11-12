<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;


class GeographyModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'geography';
		$this->idField = 'geo_id';
		$this->captionField = 'geo_caption';

	}

	public function GetCountryGeographies($country)
	{
		Profiling::BeginTimer();
		$params = array();

		$params[] = (int)$country;

		$sql = "SELECT * FROM geography WHERE geo_country_id = ?";

		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetGeographyInfo($geographyId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT
			geo_id id,
			geo_caption geography,
			geo_field_code_name field_code,
			geo_field_code_size field_size,
			geo_field_caption_name field_caption,
			geo_parent_id parent,
			geo_gradient_id gradient_id,
			geo_gradient_luminance gradient_luminance,
			grd_max_zoom_level max_zoom_level,
			grd_image_type gradient_type,
			geo_min_zoom
			FROM geography
			LEFT JOIN gradient ON geo_gradient_id = grd_id
			WHERE geo_id = ?";
		$ret = App::Db()->fetchAssoc($sql, array($geographyId));
		Profiling::EndTimer();
		return $ret;
	}

	public function GetLevel($geographyId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT
			geo_id id,
			geo_caption geography,
			geo_field_code_name field_code,
			geo_field_code_size field_size,
			geo_field_caption_name field_caption,
			geo_parent_id parent
			FROM geography
			WHERE geo_id = ?";
		$ret = App::Db()->fetchAssoc($sql, array($geographyId));
		Profiling::EndTimer();
		return $ret;
	}

	public function GetAllLevels($geographyId)
	{
		$ret = array();
		while(true) {
			$row = $this->GetLevel((int)$geographyId);
			if ($row == null)
				break;
			array_unshift($ret, $row);
			$geographyId = $row['parent'];
		}
		return $ret;
	}

	public function GetCountryGeographiesDictionary($country)
	{
		$ret = $this->GetCountryGeographies($country);
		return $this->ArrayToDictionary($ret);
	}

	public function GetGeographyTupleItems()
	{
		Profiling::BeginTimer();
		$sql = "SELECT
					gti_geography_tuple_id as TupleId,
					gti_geography_item_id as ItemId,
					gti_geography_previous_item_id as PreviousItemId
				FROM geography_tuple
				JOIN geography_tuple_item
				ON gtu_id = gti_geography_tuple_id
				AND gtu_previous_geography_id = gti_geography_previous_id
				ORDER BY gti_geography_tuple_id,
					gti_geography_item_id, gti_geography_previous_id";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}
}
