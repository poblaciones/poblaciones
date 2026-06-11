<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\admin as adminServices;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\classes\Account;
use minga\framework\Date;
use minga\framework\Profiling;

use minga\framework\PublicException;
use helena\classes\Session;

class UserService extends BaseService
{
	public function GetCurrentUser()
	{
		$userId = Account::Current()->GetUserId();
		$user = App::Orm()->find(entities\User::class, $userId);
		if ($user == null)
			throw new PublicException('No hay ningún usuario activo.');
		return $user;
	}

	public function GetOrCreate($email)
	{
		$user = App::Orm()->findByProperty(entities\User::class, "Email", $email);
		if ($user == null)
		{
			// Tiene que crearlo
			$user = new entities\User();
			$user->setEmail($email);
			$user->setCreateTime(new \DateTime('now'));
			$user->setIsActive(false);
			$user->setDeleted(false);
			$user->setPrivileges('P');
			App::Orm()->save($user);
		}
		return $user;
	}
	public function ClearSetting($key)
	{
		$userId = Session::GetCurrentUser()->GetUserId();
		$params = array($userId, $key);
		App::Db()->exec("DELETE FROM user_setting WHERE ust_user_id = ? AND ust_key = ?", $params);
		App::Db()->markTableUpdate('user_setting');
	}
	public function SetSetting($key, $value)
	{
		$this->ClearSetting($key);
		$userId = Session::GetCurrentUser()->GetUserId();
		$params = array($userId, $key, $value);
		App::Db()->exec("INSERT INTO user_setting (ust_user_id, ust_key, ust_value)
							VALUES (?, ?, ?)", $params);
		App::Db()->markTableUpdate('user_setting');
	}


	public function GetCurrentUserAccount()
	{
		Profiling::BeginTimer();
		$user = $this->GetCurrentUser();
		$ret = array(
			'Id' => $user->getId(),
			'Firstname' => $user->getFirstname(),
			'Lastname' => $user->getLastname(),
			'Email' => $user->getEmail(),
		);
		Profiling::EndTimer();
		return $ret;
	}

	public function UpdateCurrentUserName($firstname, $lastname)
	{
		Profiling::BeginTimer();
		$user = $this->GetCurrentUser();
		$user->setFirstname($firstname);
		$user->setLastname($lastname);
		App::Orm()->Save($user);
		Profiling::EndTimer();
		return self::OK;
	}

	public function ChangeCurrentUserPassword($current, $new, $verification)
	{
		Profiling::BeginTimer();
		if ($new !== $verification)
			throw new PublicException("La verificación no coincide con la contraseña.");

		$user = $this->GetCurrentUser();
		$account = new Account();
		$account->user = $user->getEmail();

		// Se valida antes de guardar para impedir el cambio sin conocer la contraseña vigente.
		if ($account->ValidatePassword($current) === false)
			throw new PublicException("La contraseña actual es incorrecta.");

		$account->SavePassword($new);
		Profiling::EndTimer();
		return self::OK;
	}

	public function GetCurrentUserDiskUsage()
	{
		$ws = new adminServices\WorkService();
		$user = $this->GetCurrentUser();
		$ws->UpdateWorkSpaceUsageByUser($user->getId());
		return $ws->GetUserTotalUsageBytes($user->getId());
	}

	public function DeleteCurrentUser()
	{
		$user = $this->GetCurrentUser();
		$ws = new adminServices\UserService();
		return $ws->DeleteUser($user->getId());
	}

}

