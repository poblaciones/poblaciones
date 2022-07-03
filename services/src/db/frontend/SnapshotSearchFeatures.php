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

class SnapshotSearchFeatures extends BaseModel
{
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

	public function GetFeatureLabelsQuery($envelope, $z)
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


