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

	public function GetFabBoundaries()
	{
		Profiling::BeginTimer();

		$sql = "SELECT bou_id Id, bou_caption Name, bgr_caption `Group`
							FROM boundary INNER JOIN boundary_group ON bou_group_id = bgr_id
							WHERE bou_visible = 1 AND EXISTS (SELECT * FROM
							snapshot_boundary_item WHERE biw_boundary_id = bou_id) ORDER BY bgr_order, bgr_caption, bou_order, bou_caption";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}
}


