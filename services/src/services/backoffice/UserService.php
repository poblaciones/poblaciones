<?php

namespace helena\services\backoffice;

use helena\classes\App;
use helena\services\common\BaseService;
use helena\entities\backoffice as entities;
use helena\classes\Account;
use minga\framework\Date;
use minga\framework\ErrorException;

class UserService extends BaseService
{
	public function GetCurrentUser()
	{
		$userId = Account::Current()->GetUserId();
		$user = App::Orm()->find(entities\User::class, $userId);
		if ($user == null)
			throw new ErrorException('No current user is active.');
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
			$user->setIsActive(false);
			$user->setDeleted(false);
			$user->setPrivileges('P');
			App::Orm()->save($user);
		}
		return $user;
	}
}

