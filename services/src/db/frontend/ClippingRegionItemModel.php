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

	public function GetClippingRegionItem($clippingRegionId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT cli_caption Name, clr_caption Type, cli_centroid Location,
					 met_id, met_title, met_abstract, met_publication_date, met_license,
								met_authors, ins_caption
						FROM clipping_region JOIN clipping_region_item ON clr_id = cli_clipping_region_id
						LEFT JOIN metadata ON met_id = clr_metadata_id
						LEFT JOIN institution ON ins_id = met_institution_id
						WHERE cli_id = ? LIMIT 1";
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


}

