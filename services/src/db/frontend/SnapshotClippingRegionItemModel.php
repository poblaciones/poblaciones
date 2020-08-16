<?php

namespace helena\db\frontend;

use helena\classes\App;

use minga\framework\Arr;
use minga\framework\Str;
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
			$sizeFilter = ' AND (SELECT GeometryAreaSphere(cli_geometry_r1) FROM clipping_region_item
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
							met_publication_date, met_license, met_authors, ins_caption, ins_watermark_id, ins_color ";
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

		$sql = "SELECT ST_AsText(PolygonEnvelope(cli_geometry)) Envelope ".
			"FROM clipping_region_item WHERE cli_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetSelectionInfoById($clippingRegionIds, $levelId, $urbanity)
	{
		Profiling::BeginTimer();

		$params = array($levelId);
		$spatial = new SpatialConditions('cgv_');

		$sql = "SELECT SUM(IFNULL(cgv_population, 0)) AS Population,
									SUM(IFNULL(cgv_households, 0)) AS Households,
									SUM(IFNULL(cgv_children, 0)) AS Children,
									SUM(IFNULL(cgv_area_m2, 0)) AS AreaM2
						FROM (SELECT MAX(IFNULL(cgv_population, 0)) AS cgv_population,
									MAX(IFNULL(cgv_households, 0)) AS cgv_households,
									MAX(IFNULL(cgv_children, 0)) AS cgv_children,
									MAX(IFNULL(cgv_area_m2, 0)) AS cgv_area_m2
									FROM snapshot_clipping_region_item_geography_item
									WHERE cgv_geography_id = ? " . $spatial->UrbanityCondition($urbanity) .
								 " AND cgv_clipping_region_item_id IN (" . Str::JoinInts($clippingRegionIds) .
																") GROUP BY cgv_geography_item_id) AS p";
		$ret = App::Db()->fetchAssoc($sql, $params);

		$sqlRegions = "SELECT cli_id Id, cli_caption Name, clr_caption Type, cli_centroid Location,
			ST_AsText(PolygonEnvelope(cli_geometry_r1)) Envelope, ".
			"met_id, met_title, met_abstract, met_publication_date, met_license,
			 met_authors, ins_caption, ins_watermark_id, ins_color " .
			"FROM clipping_region JOIN clipping_region_item ON clr_id = cli_clipping_region_id " .
			"LEFT JOIN metadata ON met_id = clr_metadata_id ".
			"LEFT JOIN institution ON ins_id = met_institution_id ".
			"WHERE cli_id IN (" . Str::JoinInts($clippingRegionIds) . ")";
		$regions = App::Db()->fetchAll($sqlRegions);
		$ret['Regions'] = $regions;

		Profiling::EndTimer();
		return $ret;
	}

	public function GetSelectionInfoByEnvelope($envelope, $levelId, $urbanity)
	{
		return $this->GetSelectionInfoByZone($envelope, $levelId, $urbanity);
	}

	public function GetSelectionInfoByCircle($circle, $levelId, $urbanity)
	{
		return $this->GetSelectionInfoByZone($circle->GetEnvelope(), $levelId, $urbanity, $circle);
	}

	private function GetSelectionInfoByZone($envelope, $levelId, $urbanity, $circle = null)
	{
		Profiling::BeginTimer();
		$params = array($levelId);
		$spatial = new SpatialConditions('giw_');

		$sql = "SELECT SUM(IFNULL(giw_population, 0)) AS Population, SUM(IFNULL(giw_households, 0)) AS Households, " .
					"SUM(IFNULL(giw_children, 0)) AS Children, SUM(IFNULL(giw_area_m2, 0)) AS AreaM2 " .
					"FROM snapshot_geography_item ".
					"WHERE giw_geography_id = ? " . $spatial->UrbanityCondition($urbanity) .
				  "AND ST_Intersects(giw_geometry_r3, ST_PolygonFromText('" . $envelope->ToWKT() . "'))";
		if ($circle != null)
		{
			$sql .= " AND EllipseContainsGeometry(". $circle->Center->ToMysqlPoint() . ", " .
				$circle->RadiusToMysqlPoint() . ", giw_geometry_r3)";
		}

		$ret = App::Db()->fetchAssoc($sql, $params);
		if ($ret !== null)
		{
			$sqlMetadata = "SELECT null Id, null Name, null Type, met_id, met_title, met_abstract, met_publication_date, met_license, met_authors, ins_caption, ins_watermark_id, ins_color " .
							"FROM geography ".
							"LEFT JOIN metadata ON met_id = geo_metadata_id ".
							"LEFT JOIN institution ON ins_id = met_institution_id ".
							"WHERE geo_id = ?";
			$retMetadata = App::Db()->fetchAll($sqlMetadata, $params);
			$ret['Regions'] = $retMetadata;
		}
		Profiling::EndTimer();
		return $ret;
	}

	public function CalculateLevelsFromRegionIds($regionItemIds, $trackingLevels = false)
	{
		Profiling::BeginTimer();
		if ($trackingLevels)
		{
			$sql = "SELECT DISTINCT C1.geo_id, C1.geo_max_zoom, C1.geo_min_zoom, C1.geo_caption, C1.geo_revision,
          C1.geo_partial_coverage, metadata.*, ins_caption, ins_watermark_id, ins_color
          FROM geography C1
					JOIN geography C2 ON C1.geo_caption = C2.geo_caption AND C1.geo_country_id = C2.geo_country_id
					LEFT JOIN metadata ON C1.geo_metadata_id = met_id
					LEFT JOIN institution ON met_institution_id = ins_id
					WHERE " . $this->existsBlock($regionItemIds, "EXISTS (SELECT * FROM snapshot_clipping_region_item_geography_item WHERE C2.geo_id = cgv_geography_id
																					AND cgv_clipping_region_item_id = ? AND C2.geo_is_tracking_level = 1) ") . "
					ORDER BY C1.geo_revision";
			$ret = App::Db()->fetchAll($sql);
		}
		else
		{
			$sql = "SELECT geo_id, geo_parent_id, geo_max_zoom, geo_min_zoom, geo_caption, geo_revision, geo_partial_coverage,
							met_id, met_title, met_abstract, met_publication_date, met_license,
							met_authors, ins_caption, ins_watermark_id, ins_color
						FROM geography C1
						LEFT JOIN metadata ON geo_metadata_id = met_id
						LEFT JOIN institution ON met_institution_id = ins_id
						WHERE " . $this->existsBlock($regionItemIds, "EXISTS (SELECT * FROM snapshot_clipping_region_item_geography_item WHERE C1.geo_id = cgv_geography_id
																			AND cgv_clipping_region_item_id = ? AND cgv_level > 0) ") . "
						ORDER BY geo_revision";
				$levels = App::Db()->fetchAll($sql);
				$ret = [];
				// No incluye aquellos cuyo padre esté en la lista ...
				// es decir, no le interesa radio si puede reportar por departamento
				foreach($levels as $level)
					if (Arr::GetItemByNamedValue($levels, 'geo_id', $level['geo_parent_id']) === null)
						$ret[] = $level;
				// saca los duplicados
				$ret = Arr::RemoveDuplicatesByNamedKey($ret, 'geo_revision');
		}
		return $ret;
	}

	private function existsBlock($ids, $sql)
	{
		$ret = "";
		foreach($ids as $id)
		{
			if ($ret <> "") $ret .= " AND ";
			$ret .= Str::Replace($sql, "?", $id);
		}
		return $ret;
	}
	public function CalculateLevelsFromPoint($coordinate)
	{
		Profiling::BeginTimer();
		$sql = "SELECT DISTINCT C1.geo_id, C1.geo_max_zoom, C1.geo_min_zoom, C1.geo_caption, C1.geo_revision,
          C1.geo_partial_coverage, metadata.*, ins_caption, ins_watermark_id, ins_color
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
	public function CalculateLevelsFromEnvelope($envelope, $zoom)
	{
		Profiling::BeginTimer();
		$sql = "SELECT C1.geo_id, C1.geo_max_zoom, C1.geo_min_zoom, C1.geo_caption, C1.geo_revision,
          C1.geo_partial_coverage, metadata.*, ins_caption, ins_watermark_id, ins_color
          FROM (SELECT min(geo_id) geo_id FROM geography
								WHERE ? >= geo_min_zoom AND ? <= geo_max_zoom
								GROUP BY geo_revision) C0
					JOIN geography C1 ON C0.geo_id = C1.geo_id
					LEFT JOIN metadata ON geo_metadata_id = met_id
					LEFT JOIN institution ON met_institution_id = ins_id
					ORDER BY C1.geo_revision";
		$ret = App::Db()->fetchAll($sql, array($zoom, $zoom));

		Profiling::EndTimer();
		return $ret;
	}
}

