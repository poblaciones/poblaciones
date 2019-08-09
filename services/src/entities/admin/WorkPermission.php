<?php

namespace helena\entities\admin;

use helena\entities\BaseMapModel;

class WorkPermission extends BaseMapModel
{
	public $Id;
	public $WorkId;
	public $UserId;
	public $Permission;

	function __construct()
	{
	}
	public static function GetMap()
	{
		return array (
			'wkp_id' => 'Id',
			'wkp_work_id' => 'WorkId',
			'wkp_user_id' => 'UserId',
			'wkp_permission' => 'Permission'
			);
	}
}



