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
		$entity->setIsActive(true);
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
							usr_privileges as Privileges, usr_create_time CreateTime, usr_is_active IsActive,
							(SELECT COUNT(*) FROM draft_work_permission JOIN draft_work ON wrk_id = wkp_work_id
											WHERE wkp_user_id = usr_id AND wrk_type = 'R') Cartographies,
							(SELECT GROUP_CONCAT(met_title ORDER BY met_title SEPARATOR '\n') FROM draft_work_permission JOIN draft_work ON wrk_id = wkp_work_id
											JOIN draft_metadata ON met_id = wrk_metadata_id WHERE wkp_user_id = usr_id AND wrk_type = 'R') CartographiesNames,
							(SELECT COUNT(*) FROM draft_work_permission JOIN draft_work ON wrk_id = wkp_work_id
											WHERE wkp_user_id = usr_id AND wrk_type = 'P') PublicData,
							(SELECT GROUP_CONCAT(met_title ORDER BY met_title SEPARATOR '\n')  FROM draft_work_permission JOIN draft_work ON wrk_id = wkp_work_id
											JOIN draft_metadata ON met_id = wrk_metadata_id WHERE wkp_user_id = usr_id AND wrk_type = 'P') PublicDataNames,
							(SELECT MAX(ses_last_login) FROM user_session WHERE ses_user_id = usr_id) LastAccess
					FROM user ORDER by usr_firstname, usr_lastname";
		$ret = App::Db()->fetchAll($sql);
		Profiling::EndTimer();
		return $ret;
	}
	public function UpdateUser($user, $password, $verification)
	{
		Profiling::BeginTimer();
		$user->setDeleted(false);

		$this->checkDuplicatedEmail($user);

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

	private function checkDuplicatedEmail($user)
	{
		$exists = "SELECT COUNT(*) FROM user WHERE usr_email = ? AND NOT usr_id <=> ?";
		$count = App::Db()->fetchScalarInt($exists, array($user->getEmail(), $user->getId()));
		if ($count > 0)
				throw new PublicException("Ya existe un usuario con esa dirección de correo electrónico.");
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
		$update = "UPDATE review FROM review, user
									SET rev_user_submission_email = usr_email
									WHERE rev_user_submission_id = usr_id AND rev_user_submission_id = ?";
		App::Db()->exec($update, array($userId));
		$delete = "DELETE FROM review WHERE rev_user_submission_id = ?";
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

