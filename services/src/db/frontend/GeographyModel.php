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
			geo_field_caption_name field_caption,
			geo_parent_id parent,
			geo_min_zoom
			FROM geography
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
}
