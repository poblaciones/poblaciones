<?php

namespace helena\services\admin;

use helena\caches\WorkPermissionsCache;
use helena\classes\App;
use helena\classes\Account;
use minga\framework\PublicException;

use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\services\backoffice\PermissionsService;
use minga\framework\Profiling;

class MarkUpdateTableService extends BaseService
{
	public function MarkTables($updateTables)
	{
		Profiling::BeginTimer();
		foreach($updateTables as $table)
			App::Db()->markTableUpdate($table);
		Profiling::EndTimer();
		return self::OK;
	}
}

