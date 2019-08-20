<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\App;
use helena\classes\Account;
use helena\classes\Register;

use minga\framework\Context;
use minga\framework\Str;
use minga\framework\Params;

class cLogin extends cController
{
	public function Show()
	{
		$alwaysAsk = Params::SafeGet('ask');

		$to = Params::SafeGet('to');
		if ($alwaysAsk !== '1' && Session::IsAuthenticated())
			return App::Redirect($to);
		$this->AddValue('to', $to);
		$this->AddValue('user', "");
		$this->AddValue('current_url', App::AbsoluteUrl(''));
		$this->AddValue('login_url_postJson', "loginAjax");
		$this->AddValue('useOpenId', Context::Settings()->useOpenId);
		$this->AddValue('useOpenIdFacebook', Context::Settings()->useOpenIdFacebook);
		$this->AddValue('useOpenIdGoogle',  Context::Settings()->useOpenIdGoogle);
		$this->AddValue('oauthGoogle_url', "/oauthGoogle.do");
		$this->AddValue('oauthFacebook_url',  "/oauthFacebook.do");

		$this->AddValue('lostPassword_url', "lostPassword");
		$this->AddValue('new_url_post', "login");

		return $this->Render('login.html.twig');
	}

	public function Post()
	{
		Register::CheckTerms();

		if(Register::CompleteOauthRegistration())
			Functions::Redirect($this->ResolveTargetPage());

		$account = new Account();

		$user = Str::ToLower(trim(Params::SafeGet('reg_username')));
		$password = Params::SafeGet('reg_password');
		$verification = Params::SafeGet('reg_verification');
		$firstName = Params::SafeGet('reg_firstName');
		$lastName = Params::SafeGet('reg_lastName');

		Register::CheckNewUser($user, $password, $verification, $firstName, $lastName);

		$account->user = $user;

		// Manda el mail de activación
		$to = Params::SafeGet("to");
		$url = $account->BeginActivation($password, $firstName, $lastName, $to);

		// Redirige...
		Session::Logoff();

		// Muestra mensaje
		return $this->ShowMessage($url);
	}

	public function ShowMessage($url)
	{
		$message = "<p style='margin-bottom: 18px'>
			Su cuenta ha sido creada exitosamente. Para poder ingresar a la misma debe primer validar su dirección de correo electrónico.
			</p>
			<p style='margin-bottom: 24px'>
			Para que pueda hacer esto, hemos enviado un mensaje a su casilla con un link de activación. Si el mensaje no aparece, verifique
			su bandeja de 'correo no deseado' o 'Spam'.
			</p><center>
			<p align='center' style='margin-bottom: 18px'><b>
			Haga click en el link del mensaje que hemos enviado para continuar o
						ingrese el código recibido</b>
			</p><p><form method='post' action='" . $url . "'>
			Código:
<p/><p><input type='text' name='id'><p>
<input type=submit class='btn' value='Ingresar'></form>
			</p>";
		$title = '¡Felicitaciones!';
		$this->AddValue('page', $title);
		$this->AddValue('message', $message);
		$this->AddValue('nobutton', true);
		$this->AddValue('action', '');
		$this->AddValue('html_title', $title);

		return $this->Render('message.html.twig');
	}
}
