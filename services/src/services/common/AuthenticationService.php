<?php

namespace helena\services\common;

use helena\classes\Account;
use helena\classes\Session;

class AuthenticationService
{
	public function GetStatus()
	{
		if (Session::IsAuthenticated())
		{
			$user = Account::Current();
			$ret = array('user' => $user->GetEmail(),
									'firstName' => $user->GetFirstName(),
									'lastname' => $user->GetLastName(),
									'master' => Account::GetMasterUser(),
									'privileges' => $user->privileges,
									'logged' => true);
		}
		else
		{
			$ret = array('user' => '',
									'firstName' => '',
									'lastname' => '',
									'master' => '',
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

