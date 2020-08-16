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

class UserService extends BaseService
{
	public function GetNewUser()
	{
		$entity = new entities\User();
		$entity->setDeleted(false);
		$entity->setPrivileges('P');
		return $entity;
	}

	public function GetCurrentUser()
	{
		$userId = Account::Current()->GetUserId();
		$user = App::Orm()->find(entities\User::class, $userId);
		if ($user === null) throw new PublicException("Usuario no encontrado.");
		return $user;
	}

	public function LoginAs($userId)
	{
		$user = App::Orm()->find(entities\User::class, $userId);
		if ($user === null) throw new PublicException("Usuario no encontrado.");
		Account::Impersonate($user->getEmail());
		return self::OK;
	}

	public function GetUsers()
	{
		Profiling::BeginTimer();
		$sql = "SELECT usr_id Id, usr_firstname Firstname, usr_lastname Lastname, usr_email Email,
							usr_privileges as Privileges, usr_create_time CreateTime, usr_is_active IsActive, (SELECT COUNT(*) FROM draft_work_permission JOIN draft_work ON wrk_id = wkp_work_id WHERE wkp_user_id = usr_id AND wrk_type = 'R') Cartographies, (SELECT COUNT(*) FROM draft_work_permission JOIN draft_work ON wrk_id = wkp_work_id WHERE wkp_user_id = usr_id AND wrk_type = 'P') PublicData, (SELECT MAX(ses_last_login) FROM user_session WHERE ses_user_id = usr_id) LastAccess FROM user ORDER by usr_firstname, usr_lastname";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}
	public function UpdateUser($user, $password, $verification)
	{
		Profiling::BeginTimer();
		$user->setDeleted(false);
		App::Orm()->Save($user);
		if ($password !== null && strlen($password) > 0)
		{
			if ($password !== $verification)
			{
				throw new PublicException("La verificación no coincide con la constraseña.");
			}
			$account = new Account();
			$account->user = $user->getEmail();
			$account->SavePassword($password);
		}
		Profiling::EndTimer();
		return self::OK;
	}
	public function DeleteUser($userId)
	{
		Profiling::BeginTimer();
		$ps = new PermissionsService();
		$current = $ps->GetPermissionsByUser($userId);
		foreach($current as $permission)
			WorkPermissionsCache::Clear($permission->getWork()->getId());
		// Borra de la base
		$delete = "DELETE FROM draft_work_permission WHERE wkp_user_id = ?";
		App::Db()->exec($delete, array($userId));

		// Libera las revisiones
		$update = "UPDATE revision FROM revision, user
									SET rev_user_submission_email = usr_email
									WHERE rev_user_submission_id = usr_id AND rev_user_submission_id = ?";
		App::Db()->exec($update, array($userId));
		$delete = "DELETE FROM revision WHERE rev_user_submission_id = ?";
		App::Db()->exec($delete, array($userId));

		// Borra las sesiones
		$delete = "DELETE FROM user_session WHERE ses_user_id = ?";
		App::Db()->exec($delete, array($userId));
		// Borra los links
		$delete = "DELETE FROM user_link WHERE lnk_user_id = ?";
		App::Db()->exec($delete, array($userId));
		// Borra al usuario
		$delete = "DELETE FROM user WHERE usr_id = ?";
		App::Db()->exec($delete, array($userId));
		Profiling::EndTimer();
		return self::OK;
	}
}

