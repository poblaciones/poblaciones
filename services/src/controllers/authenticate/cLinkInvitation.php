<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Account;
use helena\classes\Register;
use helena\classes\Session;
use helena\classes\App;
use helena\db\frontend\UserModel;
use minga\framework\MessageBox;

use minga\framework\Str;
use minga\framework\Params;
use minga\framework\Context;

class cLinkInvitation extends cController
{
	public function Show()
	{
		$userModel = new UserModel();

		$user = Str::ToLower(trim(Params::SafeGet('username')));
		$token = Params::SafeGet('id');
		$info = $userModel->GetUserLinkMessage('P', $user, $token);

		// Caso 1. Ya está con login
		if (Session::IsAuthenticated())
		{
			if (Account::Current()->user != $user)
			{
				Session::Logoff();
			}
			else
			{
				return App::Redirect($info['to']);
			}
		}
		// Caso 2. si la cuenta es activa... inicia sesión y redirige
		$isActive = $this->IsActive($user);
		if ($isActive)
		{
			$this->AddValue("login", true);
			$this->AddValue("login_url_post", '/authenticate/linkAction');
		}
		else
		{
			$this->AddValue("login", false);
			$this->AddValue("new_url_post", '/authenticate/linkAction');
		}

		// tiene que registrarse, loguear o activar la cuenta... (no tiene password)
		$this->AddValue("user", $user);
		$this->AddValue("action", $info['to']);
		$this->AddValue("to", $info['to']);
		$this->AddValue("token", $token);

		$this->AddValue('current_url', App::AbsoluteUrl(''));
		$this->AddValue('login_url_postJson', "loginAjax");
		$this->AddValue('useOpenId', Context::Settings()->useOpenId);
		$this->AddValue('useOpenIdFacebook', Context::Settings()->useOpenIdFacebook);
		$this->AddValue('useOpenIdGoogle',  Context::Settings()->useOpenIdGoogle);
		$this->AddValue('oauthGoogle_url', "/oauthGoogle");
		$this->AddValue('oauthFacebook_url',  "/oauthFacebook");
		$this->AddValue('lostPassword_url', "lostPassword");
		$this->AddValue('new_url_post', "");

		$this->AddValue("customMessage", $info['message']);

		return $this->Render("linkInvitation.html.twig");
	}

	public function Post()
	{
		if (Params::SafeGet('login') == 1)
			return $this->LoginAndRedirect();
		else
			return $this->ActivateAccountAndRedirect();
	}

	private function LoginAndRedirect()
	{
		$linkInvitation = $this->LoadInvitation();
		$user = Params::SafeGet('user');

		$ret = cLoginAjax::ProcessLogin($user);
		if ($ret !== 'ok')
			MessageBox::ThrowMessage($ret);

		return App::Redirect($linkInvitation);
	}
	private function IsActive($user)
	{
		$users = new UserModel();
		$attrs = $users->GetUserByEmail($user);
		return $attrs['usr_is_active'];
	}
	private function ActivateAccountAndRedirect()
	{
		$linkInvitation = $this->LoadInvitation();
		$user = Params::SafeGet('user');

		$account = new Account();
		$account->user = $user;
		if ($account->IsActive())
			MessageBox::ThrowBackMessage('La cuenta ya se encuentra activada.');

		Register::CheckTerms();

		if(Register::CompleteOauthRegistration('register', $user))
			return App::Redirect($linkInvitation);

		$password = Params::SafeGet('reg_password');
		$verification = Params::SafeGet('reg_verification');
		$firstName = Params::SafeGet('reg_firstName');
		$lastName = Params::SafeGet('reg_lastName');

		Register::CheckNewUser($user, $password, $verification, $firstName, $lastName);

		// inicia sesión
		if (Session::IsAuthenticated())
			Session::Logoff();
		$passwordHashed = Str::SecurePasswordHash($password);
		// activa la cuenta
		$account->SaveActivation($firstName, $lastName, $passwordHashed);
		$account->Begin();

		// salta al destino
		return App::Redirect($linkInvitation);
	}
	private function LoadInvitation()
	{
		$userModel = new UserModel();
		$user = Params::SafeGet('user');
		$token = Params::SafeGet('token');
		return $userModel->CheckUserLink('P', $user, $token);
	}

}
