<?php

namespace helena\db\frontend;

use minga\framework\Str;
use minga\framework\Context;
use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use minga\framework\Profiling;
use helena\classes\GeoJson;
use helena\classes\App;
use helena\services\backoffice\publish\snapshots\SnapshotLookupModel;

class SnapshotSearchModel extends BaseModel
{
	public function SearchClippingRegions($originalQuery)
	{
		Profiling::BeginTimer();
		$query = Str::AppendFullTextEndsWithAndRequiredSigns($originalQuery);

		$sql = "SELECT
			CAST(clc_clipping_region_item_id AS UNSIGNED INTEGER) Id,
			clc_caption Caption,
			'C' Type,
			clc_full_ids ExtraIds,
			clc_symbol Symbol,
			Replace(clc_full_parent, '\t', ' > ') Extra
			FROM snapshot_lookup_clipping_region_item
			WHERE MATCH(clc_caption, clc_tooltip) AGAINST (:query IN BOOLEAN MODE)
			ORDER by clc_population DESC
			LIMIT 0, 10";

		$ret = App::Db()->fetchAll($sql, array('query' => $query));
		Profiling::EndTimer();
		return $ret;
	}

	public function SearchFeatures($originalQuery)
	{
		Profiling::BeginTimer();
		$query = Str::AppendFullTextEndsWithAndRequiredSigns($originalQuery);

		$sql = "SELECT DISTINCT
			CAST(clf_feature_ids AS UNSIGNED INTEGER) Id,
			clf_caption Caption,
			'F' Type,
			null ExtraIds,
			clf_symbol Symbol,
			round(ST_Y(clf_location), ". GeoJson::PRECISION .") as Lat,
			round(ST_X(clf_location), ". GeoJson::PRECISION .") as Lon,
			Replace(clf_full_parent, '\t', ' > ') Extra
			FROM snapshot_lookup_feature
			WHERE MATCH(clf_caption) AGAINST (:query IN BOOLEAN MODE)
			LIMIT 0, 10";

		$ret = App::Db()->fetchAll($sql, array('query' => $query));
		Profiling::EndTimer();
		return $ret;
	}

	public function GetLabelsByEnvelope($envelope, $z)
	{
		$res = $this->ExecClippingRegionsLabelsQuery($envelope, $z);
		if ($z >= SnapshotLookupModel::SMALL_LABELS_FROM)
		{
			$features = $this->ExecFeatureLabelsQuery($envelope, $z);
			$res = array_merge($res, $features);
		}
		return $res;
	}

	private function ExecClippingRegionsLabelsQuery($envelope, $z)
	{
		Profiling::BeginTimer();

		$sql = "SELECT 'C' type, round(clc_population / 1000) Population, clc_caption Caption,
								clc_feature_ids FIDs, clc_symbol Symbol,
								CAST(clc_clipping_region_item_id AS UNSIGNED INTEGER) RID,
								round(ST_Y(clc_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(clc_location), ". GeoJson::PRECISION .") as Lon,
								clc_min_zoom MinZoom, clc_tooltip	Tooltip
								FROM snapshot_lookup_clipping_region_item
								WHERE clc_min_zoom <= ? AND clc_max_zoom >= ?
								AND ST_Contains(ST_PolygonFromText('" . $envelope->ToWKT() . "'), clc_location)
								ORDER BY clc_population DESC";
		$params = array($z, $z);
		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	private function ExecFeatureLabelsQuery($envelope, $z)
	{
		Profiling::BeginTimer();
		$sql = "SELECT clf_id, clf_dataset_id, 'F' type, 0 Population, clf_caption Caption,
								clf_feature_ids FIDs, clf_symbol Symbol,
								CAST(clf_dataset_id AS UNSIGNED INTEGER) RID,
								round(ST_Y(clf_location), ". GeoJson::PRECISION .") as Lat, round(ST_X(clf_location), ". GeoJson::PRECISION .") as Lon,
								clf_min_zoom MinZoom, clf_tooltip	Tooltip
								FROM snapshot_lookup_feature
								WHERE clf_min_zoom <= ? AND clf_max_zoom >= ?
								AND ST_Contains(ST_PolygonFromText('" . $envelope->ToWKT() . "'), clf_location)";
		$params = array($z, $z);
		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}


}


