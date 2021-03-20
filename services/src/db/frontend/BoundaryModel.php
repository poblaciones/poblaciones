<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Profiling;
use minga\framework\Str;
use minga\framework\Context;
use helena\services\backoffice\publish\PublishDataTables;

class BoundaryModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = '';
		$this->idField = '';
		$this->captionField = '';
	}

	public function GetBoundaryById($id)
	{
		Profiling::BeginTimer();
		$sql = "SELECT * FROM boundary
					WHERE bou_id = ?";
		$ret = App::Db()->fetchAssoc($sql, array($id));

		Profiling::EndTimer();
		return $ret;
	}

	public function GetSelectedBoundary($id)
	{
		Profiling::BeginTimer();
		$sql = "SELECT boundary.*, metadata.*, ins_caption, ins_watermark_id, ins_color,
						(SELECT COUNT(*) FROM snapshot_boundary_item WHERE biw_boundary_id = bou_id) AS item_count
          FROM boundary
					LEFT JOIN metadata ON met_id = IFNULL(bou_metadata_id,
    (select max(clr_metadata_id) FROM clipping_region JOIN
    boundary_clipping_region ON bcr_boundary_id = ?))
					LEFT JOIN institution ON met_institution_id = ins_id
					WHERE bou_id = ?";
		$ret = App::Db()->fetchAssoc($sql, array($id, $id));

		Profiling::EndTimer();
		return $ret;
	}

	public function GetFabBoundaries()
	{
		Profiling::BeginTimer();

		$sql = "SELECT bou_id Id, bou_caption Name, bgr_caption `Group`
							FROM boundary INNER JOIN boundary_group ON bou_group_id = bgr_id
							WHERE EXISTS (SELECT * FROM
							snapshot_boundary_item WHERE biw_boundary_id = bou_id) ORDER BY bgr_order, bgr_caption, bou_order, bou_caption";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}
}


