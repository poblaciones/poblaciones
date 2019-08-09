<?php

namespace helena\services\common;

use helena\classes\App;
use helena\services\backoffice\UserService;

use helena\classes\Session;

class AuthenticationService
{
	public function GetStatus()
	{
		if (Session::IsAuthenticated())
		{
			$userService = new UserService();
			$user = $userService->GetCurrentUser();
			$ret = array('user' => $user->getEmail(),
									'firstName' => $user->getFirstName(),
									'lastname' => $user->getLastName(),
									'privileges' => $user->getPrivileges(),
									'logged' => true);
		}
		else
		{
			$ret = array('user' => '',
									'firstName' => '',
									'lastname' => '',
									'privileges' => '',
									'logged' => false);
		}

		return $ret;
	}
	public function CompleteAuthenticationProcess()
	{
		return Session::CompleteAuthenticationProcess();
	}

}

