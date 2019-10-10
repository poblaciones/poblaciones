<?php

namespace helena\db\frontend;

use minga\framework\Str;
use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use minga\framework\Profiling;
use helena\classes\GeoJson;
use helena\classes\App;

class SnapshotLookupModel extends BaseModel
{
	private $spatialConditions;
	public function __construct()
	{
		$this->tableName = 'snapshot_lookup';
		$this->idField = 'clv_id';
		$this->captionField = 'clv_caption';
		$this->spatialConditions = new SpatialConditions('clv');
	}

	public function Search($originalQuery, $type)
	{
		Profiling::BeginTimer();
		$query = Str::AppendFullTextEndsWithAndRequiredSigns($originalQuery);

		$sql = "SELECT DISTINCT
			CAST((case when clv_type='C' then clv_clipping_region_item_id else clv_feature_ids end) AS UNSIGNED INTEGER) id,
			clv_caption caption,
			clv_type type,
			clv_full_ids extraIds,
			clv_symbol symbol,
			round(Y(clv_location), ". GeoJson::PRECISION .") as Lat,
			round(X(clv_location), ". GeoJson::PRECISION .") as Lon,
			Replace(clv_full_parent, '\t', ' > ') extra
			FROM snapshot_lookup
			WHERE MATCH(clv_caption) AGAINST (:query IN BOOLEAN MODE)
			AND clv_type = '" . $type . "'
			ORDER by clv_population DESC
			LIMIT 0, 10";

		$ret = App::Db()->fetchAll($sql, array('query' => $query));
		Profiling::EndTimer();
		return $ret;
	}

	public function GetLabelsByEnvelope($envelope, $z)
	{
		return $this->ExecLabelsQuery($envelope, $z);
	}

	public function GetLabelsByRegionId($envelope, $clippingRegionId, $circle, $z)
	{
		$query =  $this->spatialConditions->CreateRegionQuery($clippingRegionId);

		if ($circle != null)
			$circleQuery =  $this->spatialConditions->CreateCircleQuery($circle, 'L');
		else
			$circleQuery = null;

		return $this->ExecLabelsQuery($envelope, $z, $query, $circleQuery);
	}

	public function GetLabelsByCircle($envelope, $circle, $z)
	{
		$query =  $this->spatialConditions->CreateCircleQuery($circle, 'L');

		return $this->ExecLabelsQuery($envelope, $z, $query);
	}

	private function ExecLabelsQuery($envelope, $z, $query = null, $extraQuery = null)
	{
		Profiling::BeginTimer();
		$envelopeQuery = new QueryPart("", "ST_Contains(PolygonFromText('" . $envelope->ToWKT() . "'), clv_location)");

		$select = "clv_type type, round(clv_population / 1000) Population, clv_caption Caption, (case when clv_type = 'C' then null else clv_feature_ids end) FIDs, clv_symbol Symbol,
								CAST((case when clv_type = 'C' then clv_clipping_region_item_id else clv_dataset_id end) AS UNSIGNED INTEGER) RID,
								round(Y(clv_location), ". GeoJson::PRECISION .") as Lat, round(X(clv_location), ". GeoJson::PRECISION .") as Lon, clv_min_zoom MinZoom, clv_tooltip	Tooltip";

		$from = $this->tableName;

		$where = "clv_min_zoom <= ? AND clv_max_zoom >= ?";

		$params = array($z, $z);

		$baseQuery = new QueryPart($from, $where, $params, $select, null, "clv_population DESC");

		$multiQuery = new MultiQuery($baseQuery, $envelopeQuery, $query, $extraQuery);
		//$multiQuery->dump();
		$ret = App::Db()->fetchAll($multiQuery->sql, $multiQuery->params);
		Profiling::EndTimer();
		return $ret;
	}

}


