<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;

class ClippingRegionItemModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'clipping_region_item';
		$this->idField = 'cli_id';
		$this->captionField = 'cli_caption';

	}

	public function GetClippingRegionItemGeometry($clippingRegionId)
	{
		Profiling::BeginTimer();
		$params = array($clippingRegionId);

		$sql = "SELECT cli_geometry_r1 Geometry, ST_AsText(PolygonEnvelope(cli_geometry_r1)) Envelope ".
			"FROM clipping_region_item WHERE cli_id = ? LIMIT 1";

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetClippingRegionItem($clippingRegionId, $includeParents = false)
	{
		Profiling::BeginTimer();

		if ($includeParents)
		{
			$parentJoin = "LEFT JOIN clipping_region_item parent ON parent.cli_id = cli.cli_parent_id
						LEFT JOIN clipping_region_item grandParent ON grandParent.cli_id = parent.cli_parent_id";
			$parentSelect = ", parent.cli_caption parentCaption, grandParent.cli_caption grandParentCaption ";
		}
		else
		{
			$parentJoin = '';
			$parentSelect = '';
		}
		$sql = "SELECT cli.cli_caption Name, clr_caption Type,
									cli.cli_centroid Location,
					 met_id, met_title, met_abstract, met_publication_date, met_license,
								met_authors, ins_caption " . $parentSelect . "
						FROM clipping_region JOIN clipping_region_item cli ON clr_id = cli.cli_clipping_region_id
						" . $parentJoin . "
						LEFT JOIN metadata ON met_id = clr_metadata_id
						LEFT JOIN institution ON ins_id = met_institution_id
						WHERE cli.cli_id = ? LIMIT 1";
		$params = array($clippingRegionId);

		$ret = App::Db()->fetchAssoc($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetClippingRegionItems($clrId, $parentId = 0)
	{
		Profiling::BeginTimer();
		$params = array((int)$clrId);
		$where = $this->Where($parentId, $params, 'cli_parent_id');

		$sql = 'SELECT cli_id AS id, cli_caption AS name FROM clipping_region_item WHERE cli_clipping_region_id = ? '.$where;
		$ret = App::Db()->fetchAll($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function GetCrawlerItemsIntersectingEnvelope($metricId, $versionIds, $envelope, $parentId)
	{
	/*
	VALIDO 1:

SELECT cli_id Id, cli_caption Name, cli_parent_id, clr_id, clr_caption FROM clipping_region_item JOIN clipping_region ON cli_clipping_region_id = clr_id WHERE ST_INTERSECTS(cli_geometry_r1, ST_PolygonFromText('POLYGON((-72.88671 -54.83585, -53.63833 -54.83585, -53.63833 -21.87661, -72.88671 -21.87661, -72.88671 -54.83585))')) AND ST_AREA(ST_INTERSECTION(cli_geometry_r1, ST_PolygonFromText('POLYGON((-72.88671 -54.83585, -53.63833 -54.83585, -53.63833 -21.87661, -72.88671 -21.87661, -72.88671 -54.83585))'))) > 0.5 * ST_AREA(cli_geometry_r1) AND clr_is_crawler_indexer = 1 AND EXISTS(SELECT 1 FROM snapshot_metric_version_item_variable JOIN snapshot_clipping_region_item_geography_item ON cgv_geography_item_id = miv_geography_item_id WHERE miv_metric_id = 3801 AND miv_metric_version_id = 1101 AND cgv_clipping_region_item_id = cli_id) AND cli_parent_id = 11900 ORDER BY clr_caption, clr_id, cli_caption, cli_id

VALIDO 2: 5 sec.

SELECT cli_id ´Id´, cli_caption ´Name´, cli_parent_id, clr_id, clr_caption FROM clipping_region_item JOIN clipping_region ON cli_clipping_region_id = clr_id
JOIN snapshot_clipping_region_item_geography_item ON cgv_clipping_region_item_id = cli_id
JOIN snapshot_metric_version_item_variable  ON cgv_geography_item_id = miv_geography_item_id

WHERE ST_INTERSECTS(cli_geometry_r1, ST_PolygonFromText('POLYGON((-72.88671 -54.83585, -53.63833 -54.83585, -53.63833 -21.87661, -72.88671 -21.87661, -72.88671 -54.83585))')) AND ST_AREA(ST_INTERSECTION(cli_geometry_r1, ST_PolygonFromText('POLYGON((-72.88671 -54.83585, -53.63833 -54.83585, -53.63833 -21.87661, -72.88671 -21.87661, -72.88671 -54.83585))'))) > 0.5 * ST_AREA(cli_geometry_r1) AND clr_is_crawler_indexer = 1
AND miv_metric_id = 3801 AND miv_metric_version_id = 1101 AND cli_parent_id = 11900
GROUP BY cli_id , cli_caption, cli_parent_id, clr_id, clr_caption
ORDER BY clr_caption, clr_id, cli_caption, cli_id

VALIDO 3: 1.28

SELECT cli_id ´Id´, cli_caption ´Name´, cli_parent_id, clr_id, clr_caption FROM clipping_region_item JOIN clipping_region ON cli_clipping_region_id = clr_id
JOIN snapshot_clipping_region_item_geography_item ON cgv_clipping_region_item_id = cli_id
JOIN snapshot_metric_version_item_variable  ON cgv_geography_item_id = miv_geography_item_id

WHERE clr_is_crawler_indexer = 1
AND miv_metric_id = 3801 AND miv_metric_version_id = 1101 AND cli_parent_id = 11900
GROUP BY cli_id , cli_caption, cli_parent_id, clr_id, clr_caption
ORDER BY clr_caption, clr_id, cli_caption, cli_id
*/
		Profiling::BeginTimer();
		// Trae regiones que coincidan con la región de la cartografía
		// y que tengan contenidos dentro del clipping_region_item.
/*		$sql = "SELECT cli_id Id, cli_caption Name, cli_parent_id, clr_id, clr_caption FROM clipping_region_item
							JOIN clipping_region ON cli_clipping_region_id = clr_id
							WHERE ST_INTERSECTS(cli_geometry_r1,
											ST_PolygonFromText('" . $envelope->ToWKT() . "'))
										AND ST_AREA(ST_INTERSECTION(cli_geometry_r1,
											ST_PolygonFromText('" . $envelope->ToWKT() . "'))) > 0.5 *
												ST_AREA(cli_geometry_r1)
										AND clr_is_crawler_indexer = 1
										AND EXISTS(SELECT 1 FROM snapshot_metric_version_item_variable
													JOIN metric_version ON mvr_id = miv_metric_version_id
													JOIN snapshot_clipping_region_item_geography_item ON cgv_geography_item_id = miv_geography_item_id
													WHERE mvr_work_id = ? AND miv_metric_id = ? AND cgv_clipping_region_item_id = cli_id)";
	*/
		$sql = "SELECT cli_id Id, cli_caption Name, cli_parent_id, clr_id, clr_caption
						FROM clipping_region_item JOIN clipping_region ON cli_clipping_region_id = clr_id
						JOIN snapshot_clipping_region_item_geography_item ON cgv_clipping_region_item_id = cli_id
						JOIN snapshot_metric_version_item_variable  ON cgv_geography_item_id = miv_geography_item_id
						WHERE clr_is_crawler_indexer = 1
						AND miv_metric_id = ? AND ( " . $versionIds . ") " . ($parentId ? ' AND cli_parent_id = ' . $parentId : '') . "
						GROUP BY cli_id , cli_caption, cli_parent_id, clr_id, clr_caption
						ORDER BY clr_caption, clr_id, cli_caption, cli_id";
		$ret = App::Db()->fetchAll($sql, array($metricId));
		Profiling::EndTimer();
		return $ret;
	}
}

