<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Str;
use minga\framework\Profiling;

class ClippingRegionItemModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'clipping_region_item';
		$this->idField = 'cli_id';
		$this->captionField = 'cli_caption';

	}

	public function GetClippingRegionItemGeometry($clippingRegionIds)
	{
		Profiling::BeginTimer();

		$sql = "SELECT cli_id Id, cli_geometry_r1 Geometry, ST_AsText(PolygonEnvelope(cli_geometry_r1)) Envelope ".
			"FROM clipping_region_item WHERE cli_id IN (" . Str::JoinInts($clippingRegionIds) . ")";

		$ret = App::Db()->fetchAll($sql);
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
							met_authors, ins_caption, ins_watermark_id, ins_color " . $parentSelect . "
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

	public function GetCrawlerItemsIntersectingEnvelope($metricId, $datasetTables, $envelope, $parentId)
	{
		Profiling::BeginTimer();
		// Trae regiones que coincidan con la región de la cartografía
		// y que tengan contenidos dentro del clipping_region_item.
		$datasetPart = '';
		foreach($datasetTables as $datasetTable)
		{
			if ($datasetPart != '') $datasetPart .= " OR ";
			$datasetPart .= " EXISTS (SELECT * FROM " . $datasetTable . " WHERE sna_geography_item_id = cgv_geography_item_id) ";
		}
		$datasetPart = " (" . $datasetPart . ")";

		$sql = "SELECT cli_id Id, cli_caption Name, cli_parent_id, clr_id, clr_caption
						FROM clipping_region_item JOIN clipping_region ON cli_clipping_region_id = clr_id
						JOIN snapshot_clipping_region_item_geography_item ON cgv_clipping_region_item_id = cli_id
						WHERE " .
						$datasetPart . "
						AND clr_is_crawler_indexer = 1 AND cgv_level > 0
						" . ($parentId ? ' AND cli_parent_id = ' . $parentId : '') . "
						GROUP BY cli_id , cli_caption, cli_parent_id, clr_id, clr_caption
						ORDER BY clr_caption, clr_id, cli_caption, cli_id";

		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}
}

