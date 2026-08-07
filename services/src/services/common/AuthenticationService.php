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
			$time = $user->GetUserCreateTime();
			$ret = array('User' => $user->GetEmail(),
									'Firstname' => $user->GetFirstName(),
									'Lastname' => $user->GetLastName(),
									'Picture' => $user->GetPicture(),
									//'UserId' => $user->GetUserId(),
									'CreateTime' => ($time == null ? '' : $time . ''),
									'Master' => Account::GetMasterUser(),
									'Privileges' => $user->privileges,
									'Settings' => $user->GetSettings(),
									'Logged' => true);
		}
		else
		{
			$ret = array('User' => '',
									'FirstName' => '',
									'Lastname' => '',
									'Picture' => '',
									'UserId' => '',
									'Master' => '',
									'CreateTime' => '',
									'Privileges' => '',
									'Logged' => false);
		}

		return $ret;
	}

}

