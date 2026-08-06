<?php

namespace helena\services\admin;

use helena\caches\WorkPermissionsCache;
use helena\classes\App;
use helena\classes\Account;
use helena\classes\AutomationAuth;
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
		$entity->setCreateTime(new \DateTime('now'));
		$entity->setIsActive(true);
		return $entity;
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
		$update = "UPDATE review JOIN user ON rev_user_submission_id = usr_id
									SET rev_user_submission_email = usr_email, rev_user_submission_id = null
									WHERE rev_user_submission_id = ?";
		App::Db()->exec($update, array($userId));

		// rev_user_decision_id (quién tomó la decisión, distinto de quién
		// envió la revisión) tiene la misma regla RESTRICT. Se libera acá
		// sin preservar el email todavía: a confirmar si existe una
		// columna análoga a rev_user_submission_email para este caso.
		$update = "UPDATE review SET rev_user_decision_id = null WHERE rev_user_decision_id = ?";
		App::Db()->exec($update, array($userId));

		// Libera la referencia a "quién publicó por última vez" en los
		// metadatos (borrador y publicado): met_last_online_user_id tiene
		// ON DELETE NO ACTION, así que si no se libera antes, MySQL
		// rechaza el borrado del usuario en cuanto tiene algún metadata
		// marcado como publicado por él (error 1451).
		$update = "UPDATE draft_metadata SET met_last_online_user_id = null WHERE met_last_online_user_id = ?";
		App::Db()->exec($update, array($userId));
		$update = "UPDATE metadata SET met_last_online_user_id = null WHERE met_last_online_user_id = ?";
		App::Db()->exec($update, array($userId));

		// Ídem con "quién hizo la última actualización" de una cartografía
		// (borrador y publicada): wrk_update_user_id tiene la misma regla
		// ON DELETE NO ACTION.
		$update = "UPDATE draft_work SET wrk_update_user_id = null WHERE wrk_update_user_id = ?";
		App::Db()->exec($update, array($userId));
		$update = "UPDATE work SET wrk_update_user_id = null WHERE wrk_update_user_id = ?";
		App::Db()->exec($update, array($userId));

		// Borra las sesiones
		$delete = "DELETE FROM user_session WHERE ses_user_id = ?";
		App::Db()->exec($delete, array($userId));
		// Borra los links
		$delete = "DELETE FROM user_link WHERE lnk_user_id = ?";
		App::Db()->exec($delete, array($userId));
		// Borra los keys
		$delete = "DELETE FROM user_key WHERE key_user_id = ?";
		App::Db()->exec($delete, array($userId));
		// Borra la configuración personal
		$delete = "DELETE FROM user_setting WHERE ust_user_id = ?";
		App::Db()->exec($delete, array($userId));
		// Borra al usuario
		$delete = "DELETE FROM user WHERE usr_id = ?";
		App::Db()->exec($delete, array($userId));

		App::Db()->markTableUpdate('draft_work_permission');
		App::Db()->markTableUpdate('review');
		App::Db()->markTableUpdate('draft_metadata');
		App::Db()->markTableUpdate('metadata');
		App::Db()->markTableUpdate('draft_work');
		App::Db()->markTableUpdate('work');
		App::Db()->markTableUpdate('user_session');
		App::Db()->markTableUpdate('user_link');
		App::Db()->markTableUpdate('user_setting');
		App::Db()->markTableUpdate('user');

		Profiling::EndTimer();
		return self::OK;
	}

	public function CreateUserKey($userId, $description)
	{
		[$plainKey, $hash] = AutomationAuth::GenerateKey();

		App::Db()->insert('user_key', [
			'key_hash' => $hash,
			'key_user_id' => $userId,
			'key_description' => $description,
			'key_active' => 1,
			'key_created_at' => (new \DateTime())->format('Y-m-d H:i:s'),
		]);

		$keyId = App::Db()->lastInsertId();

		return [
			'key_id' => (int) $keyId,
			'plain_key' => $plainKey,
			'description' => $description,
		];
	}

	public function UpdateUserKey($keyId, $description, $active)
	{
		$fields = [];
		if ($description !== null)
			$fields['key_description'] = $description;
		if ($active !== null)
			$fields['key_active'] = $active;

		App::Db()->update('user_key', $fields, ['key_id' => $keyId]);
	}

	public function DeleteUserKey($keyId)
	{
		App::Db()->delete('user_key', ['key_id' => $keyId]);
	}

	public function GetUserKeys($userId)
	{
		$rows = App::Db()->fetchAll(
			'SELECT key_id, key_description, key_active, key_created_at, key_last_used
		   FROM user_key WHERE key_user_id = ?
		  ORDER BY key_created_at DESC',
			[$userId]
		);
		return $rows;
	}
}
