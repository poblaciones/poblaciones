<?php

namespace helena\caches;

use minga\framework\caching\ObjectCache;
use helena\classes\Account;
use helena\classes\App;

class WorkPermissionsCache extends BaseCache
{
	const ADMIN = 1;
	const EDIT = 2;
	const VIEW = 3;

	public static function Cache()
	{
		return new ObjectCache("Works/Permissions");
	}
	public static function Clear($workId)
	{
		self::Cache()->Clear($workId);
	}
	public static function GetCurrentUserPermission($workId)
	{
		$account = Account::Current();
		$email = $account->user;
		$cache = self::Cache();
		$rows = null;
		if ($cache->HasData($workId, $rows) === false)
		{
			// La resuelve
			$select = "SELECT usr_email Email, wkp_permission Permission, wrk_is_indexed Indexed, wrk_is_example Example
						FROM draft_work_permission
						JOIN user ON wkp_user_id = usr_id
						JOIN draft_work ON wkp_work_id = wrk_id
						WHERE wkp_work_id = ?";
			$rows = App::Db()->fetchAll($select, array($workId));
			$cache->PutData($workId, $rows);
		}
		// Devuelve lo solicitado
		$view = false;
		$edit = false;
		$admin = false;
		foreach($rows as $row)
		{
			if ($row['Example'])
			{
				$view = true;
			}
			if ($row['Email'] === $email)
			{
				if ($row['Permission'] === 'V' || $row['Indexed'])
					$view = true;
				else {
					if ($row['Permission'] === 'E')
						$edit = true;
					if ($row['Permission'] === 'A')
						$admin = true;
				}
			}
		}
		if ($admin) return self::ADMIN;
		if ($edit) return self::EDIT;
		if ($view) return self::VIEW;
		return null;
	}
}

