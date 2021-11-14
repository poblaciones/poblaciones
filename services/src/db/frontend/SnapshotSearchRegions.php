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

class SnapshotSearchRegions extends BaseModel
{
	public function SearchClippingRegions($originalQuery)
	{
		Profiling::BeginTimer();
		$query = Str::AppendFullTextEndsWithAndRequiredSigns($originalQuery);

		$explicitExclusions = $this->ResolveExclusions($originalQuery);

		$sql = "SELECT
			CAST(clc_clipping_region_item_id AS UNSIGNED INTEGER) Id,
			clc_caption Caption,
			'C' Type,
			clc_full_ids ExtraIds,
			clc_symbol Symbol,
			Replace(clc_full_parent, '\t', ' > ') Extra,
			MATCH(clc_caption) AGAINST (:query) Relevance
			FROM snapshot_lookup_clipping_region_item
			WHERE
			MATCH(clc_caption, clc_tooltip, clc_full_parent, clc_code) AGAINST (:query IN BOOLEAN MODE)
			" . $explicitExclusions . " ORDER by
			Relevance DESC,
			clc_population DESC
			LIMIT 0, 10";

		$ret = App::Db()->fetchAll($sql, array('query' => $query));
		Profiling::EndTimer();
		return $ret;
	}

	private function ResolveExclusions($originalQuery)
	{
		$explicitSearchResults = Context::Settings()->Map()->ExplicitRegionSearchResults;
		if(!$explicitSearchResults)
		{
			return '';
		}
		$ret = '';
		foreach($explicitSearchResults as $key => $validations)
		{
			if (!Str::ContainsAnyI($originalQuery, (is_array($validations) ? $validations : [$validations])))
				$ret .= " AND clc_caption NOT LIKE '%" . $key . "%'
									AND clc_tooltip NOT LIKE '%" . $key . "%'
									AND clc_full_parent NOT LIKE '%" . $key . "%' ";
		}
		if ($ret == '') return '';
		return $ret;
	}


	public function GetClippingRegionsLabelsQuery($envelope, $z)
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
}


