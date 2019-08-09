<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Account;
use helena\classes\Register;
use helena\classes\Session;
use helena\classes\App;

use minga\framework\Str;
use minga\framework\Params;

class cLinkActivation extends cController
{
	public function Show()
	{
		$user = Str::ToLower(trim(Params::Get('username')));
		$id = Params::Get('id');

		$account = new Account();
		$account->user = $user;

		$to = $account->Activate($id);
		// Sale con redirect
		$account->Begin();

		return App::Redirect($to);
	}
	public function Post()
	{
		return $this->Show();
	}
}
