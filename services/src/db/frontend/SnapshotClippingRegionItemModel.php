<?php

namespace helena\db\frontend;

use helena\entities\frontend\geometries\Coordinate;
use helena\classes\App;
use minga\framework\Context;
use minga\framework\Profiling;


class SnapshotClippingRegionItemModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'snapshot_clipping_region_item_geography_item';
		$this->idField = 'cgv_id';
	}

	public function GetFirstClippingRegion()
	{
		Profiling::BeginTimer();
		$def = Context::Settings()->Map()->DefaultClippingRegion;
		if ($def)
		{
			Profiling::EndTimer();
			return array('Id' => $def);
		}
		$params = array();

		$sql = "SELECT cgv_clipping_region_item_id as Id " .
			"FROM snapshot_clipping_region_item_geography_item ".
			"ORDER BY cgv_clipping_region_priority DESC, cgv_clipping_region_item_id ASC ".
			"LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetClippingRegionItemByLocation($coordinate, $includeName = false, $sizeThreshold = -1)
	{
		Profiling::BeginTimer();
		$params = array();
		$coordinate->ToParams($params);
		if ($sizeThreshold !== -1)
		{
			$sizeFilter = ' AND (SELECT ST_AREA(cli_geometry_r1) FROM clipping_region_item
																WHERE cgv_clipping_region_item_id = cli_id) > ' . $sizeThreshold	;
		}
		else
		{
			$sizeFilter = '';
		}
		$nameFields = "";
		$nameJoins = "";
		if ($includeName)
		{
			$nameFields = ", cli_caption Name, met_id, met_title, met_abstract,
												met_publication_date, met_license, met_authors, ins_caption ";
			 $nameJoins = " JOIN clipping_region_item ON cli_id = cgv_clipping_region_item_id
											JOIN clipping_region ON clr_id = cli_clipping_region_id
											LEFT JOIN metadata ON met_id = clr_metadata_id
											LEFT JOIN institution ON ins_id = met_institution_id ";
		}
		$sql = "SELECT cgv_clipping_region_item_id as Id " . $nameFields .
			" FROM snapshot_geography_item JOIN snapshot_clipping_region_item_geography_item ON cgv_geography_item_id = giw_geography_item_id "
			. $nameJoins .
			"WHERE ST_CONTAINS(giw_geometry_r3 , POINT(?, ?)) AND giw_geography_is_tracking_level = 1 ".
			$sizeFilter .
			" ORDER BY cgv_clipping_region_priority DESC ".
			"LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetClippingRegionItemEnvelope($clippingRegionId)
	{
		Profiling::BeginTimer();
		$params = array($clippingRegionId);

		$sql = "SELECT AsText(Envelope(cli_geometry)) Envelope ".
			"FROM clipping_region_item WHERE cli_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetSelectionInfoById($clippingRegionId, $levelId)
	{
		Profiling::BeginTimer();
		$viewSql = $this->CreateRegionQuery();
		$params = array($levelId, $clippingRegionId);

		$sql = "SELECT cli_caption Name, clr_caption Type, cli_centroid Location, ".
			"T2.Population, T2.Households, T2.Children, T2.AreaM2,
			 met_id, met_title, met_abstract, met_publication_date, met_license,
								met_authors, ins_caption " .
			"FROM clipping_region JOIN clipping_region_item ON clr_id = cli_clipping_region_id " .
			"LEFT JOIN metadata ON met_id = clr_metadata_id ".
			"LEFT JOIN institution ON ins_id = met_institution_id ".
			"JOIN (" . $viewSql . ") AS T2 ON cli_id = T2.Id LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	private function CreateRegionQuery()
	{
		$sql = "SELECT cgv_clipping_region_item_id Id, SUM(IFNULL(cgv_population, 0)) AS Population, SUM(IFNULL(cgv_households, 0)) AS Households, SUM(IFNULL(cgv_children, 0)) AS Children, SUM(IFNULL(cgv_area_m2, 0)) AS AreaM2 " .
			" FROM snapshot_clipping_region_item_geography_item WHERE cgv_geography_id = ? AND cgv_clipping_region_item_id = ? GROUP BY cgv_clipping_region_item_id";
		return $sql;
	}

	public function GetSelectionInfoByEnvelope($envelope, $levelId)
	{
		return $this->GetSelectionInfoByZone($envelope, $levelId);
	}

	public function GetSelectionInfoByCircle($circle, $levelId)
	{
		return $this->GetSelectionInfoByZone($circle->GetEnvelope(), $levelId, $circle);
	}

	public function GetSelectionInfoByZone($envelope, $levelId, $circle = null)
	{
		Profiling::BeginTimer();
		$params = array($levelId);

		$sql = "SELECT SUM(IFNULL(giw_population, 0)) AS Population, SUM(IFNULL(giw_households, 0)) AS Households, " .
					"SUM(IFNULL(giw_children, 0)) AS Children, SUM(IFNULL(giw_area_m2, 0)) AS AreaM2, null Name, null Type " .
					"FROM snapshot_geography_item ".
					"WHERE giw_geography_id = ? AND ".
					"ST_Intersects(giw_geometry_r3, PolygonFromText('" . $envelope->ToWKT() . "'))";
		if ($circle != null)
		{
			$sql .= " AND EllipseContainsGeometry(". $circle->Center->ToMysqlPoint() . ", " .
				$circle->RadiusToMysqlPoint() . ", giw_geometry_r3)";
		}

		$ret = App::Db()->fetchAssoc($sql, $params);
		if ($ret !== null)
		{
			$sqlMetadata = "SELECT met_id, met_title, met_abstract, met_publication_date, met_license, met_authors, ins_caption  " .
							"FROM geography ".
							"LEFT JOIN metadata ON met_id = geo_metadata_id ".
							"LEFT JOIN institution ON ins_id = met_institution_id ".
							"WHERE geo_id = ?";
			$retMetadata = App::Db()->fetchAssoc($sqlMetadata, $params);
			$ret = array_merge($ret, $retMetadata);
		}
		Profiling::EndTimer();
		return $ret;
	}

	public function CalculateLevelsFromRegionId($regionItemId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT geo_id, geo_max_zoom, geo_caption, geo_revision, geo_partial_coverage,
								met_id, met_title, met_abstract, met_publication_date, met_license,
								met_authors, ins_caption
							FROM clipping_region_item
							JOIN clipping_region ON clr_id = cli_clipping_region_id
							JOIN clipping_region_geography ON  crg_clipping_region_id = clr_id
							JOIN geography C1 ON crg_geography_id = geo_id
							LEFT JOIN metadata ON geo_metadata_id = met_id
							LEFT JOIN institution ON met_institution_id = ins_id
							WHERE  cli_id = ? ORDER BY geo_revision";
		$params = array($regionItemId);
		return App::Db()->fetchAll($sql, $params);
	}

	public function CalculateLevelsFromPoint($coordinate)
	{
		Profiling::BeginTimer();
		$sql = "SELECT DISTINCT C1.geo_id, C1.geo_max_zoom, C1.geo_caption, C1.geo_revision,
          C1.geo_partial_coverage, metadata.*, ins_caption
          FROM geography C1
					JOIN geography C2 ON C1.geo_caption = C2.geo_caption AND C1.geo_country_id = C2.geo_country_id
					JOIN snapshot_geography_item ON C2.geo_id = giw_geography_id
					LEFT JOIN metadata ON C1.geo_metadata_id = met_id
					LEFT JOIN institution ON met_institution_id = ins_id
					WHERE ST_CONTAINS (giw_geometry_r3 , POINT(?, ?)) AND giw_geography_is_tracking_level = 1
					ORDER BY C1.geo_revision";
		$params = array();
		$coordinate->ToParams($params);
		$ret = App::Db()->fetchAll($sql, $params);

		Profiling::EndTimer();
		return $ret;
	}
	public function CalculateLevelsFromEnvelope($envelope)
	{
		Profiling::BeginTimer();
		$sql = "SELECT DISTINCT C1.geo_id, C1.geo_max_zoom, C1.geo_caption, C1.geo_revision,
          C1.geo_partial_coverage, metadata.*, ins_caption
          FROM geography C1
					JOIN geography C2 ON C1.geo_caption = C2.geo_caption AND C1.geo_country_id = C2.geo_country_id
					LEFT JOIN metadata ON C1.geo_metadata_id = met_id
					LEFT JOIN institution ON met_institution_id = ins_id
					WHERE EXISTS (SELECT * FROM snapshot_geography_item WHERE C2.geo_id = giw_geography_id
					AND MBRIntersects(giw_geometry_r3, PolygonFromText('" . $envelope->ToWKT() . "')) AND giw_geography_is_tracking_level = 1)
					ORDER BY C1.geo_revision";
		$ret = App::Db()->fetchAll($sql);
		
		Profiling::EndTimer();
		return $ret;
	}
}

