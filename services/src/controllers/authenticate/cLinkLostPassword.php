<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Account;
use helena\classes\Register;
use helena\classes\Session;
use helena\classes\App;

use minga\framework\Str;
use minga\framework\Params;

class cLinkLostPassword extends cController
{
	public function Show()
	{
		$user = Str::ToLower(trim($_GET['username']));
		$id = $_GET['id'];

		$account = new Account();
		$account->user = $user;
		$to = $account->LostPasswordActivate($id);
		$this->AddValue('to', $to);

		return $this->Render('linkLostPassword.html.twig');
	}

	public function Post()
	{
		Session::CheckSessionAlive();
		$account = Account::Current();
		$to = Params::SafeGet('to');

		$password = $_POST['password'];
		$verification = $_POST['verification'];

		Register::CheckNewPassword($password, $verification);

		$account->SavePassword($password);

		return App::Redirect($to);
	}
}
