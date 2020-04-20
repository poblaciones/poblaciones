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
			$ret = array('User' => $user->GetEmail(),
									'Firstname' => $user->GetFirstName(),
									'Lastname' => $user->GetLastName(),
									'Master' => Account::GetMasterUser(),
									'Privileges' => $user->privileges,
									'Logged' => true);
		}
		else
		{
			$ret = array('User' => '',
									'FirstName' => '',
									'Lastname' => '',
									'Master' => '',
									'Privileges' => '',
									'Logged' => false);
		}

		return $ret;
	}

}

