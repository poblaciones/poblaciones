<?php

namespace helena\db\admin;

use helena\entities\admin\Contact;

use minga\framework\Profiling;
use helena\classes\App;

class WorkPermissionModel extends BaseModel
{
	public function __construct()
	{
		$this->tableName = 'draft_work_permission';
		$this->idField = 'wkp_id';
	}
}


