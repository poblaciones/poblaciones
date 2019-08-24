<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\App;
use helena\classes\Account;
use helena\classes\Remember;
use helena\classes\Register;

use minga\framework\Context;
use minga\framework\Str;
use minga\framework\Params;
use minga\framework\MessageBox;
use minga\framework\PhpSession;
use minga\framework\oauth\OauthData;

class cLogin extends cController
{
	public function Show($forceShow = false)
	{
		if (array_key_exists('post', $_GET) && !$forceShow)
		{
			return $this->Post();
		}
		$alwaysAsk = Params::SafeGet('ask');

		$to = Params::SafeGet('to');
		if ($alwaysAsk !== '1' && Session::IsAuthenticated())
		{
			if ($to == '/' || Str::StartsWithI($to, '/login.do') || $to == '')
				return Session::GoProfile();
			else
				return App::Redirect($to);
		}
		$this->AddValue('to', $to);
		$this->AddValue('user', "");
		$this->AddValue('current_url', App::AbsoluteUrl(''));
		$this->AddValue('login_url_postJson', "loginAjax");
		$this->AddValue('useOpenId', Context::Settings()->useOpenId);
		$this->AddValue('useOpenIdFacebook', Context::Settings()->useOpenIdFacebook);
		$this->AddValue('useOpenIdGoogle',  Context::Settings()->useOpenIdGoogle);
		$this->AddValue('oauthGoogle_url', "/oauthGoogle");
		$this->AddValue('oauthFacebook_url',  "/oauthFacebook");
		$this->AddValue('login_url_post', "/authenticate/login?post");

		$this->AddValue('lostPassword_url', "lostPassword");
		$this->AddValue('new_url_post', "/authenticate/register?post");

		return $this->Render('login.html.twig');
	}

	public function Post()
	{
		$user = Params::SafeGet('username');
		if ($user != '')
		{
			// Login tradicional
			$account = self::ProcessLogin($user);
			$returnUrl = Params::SafeGet('returnUrl');
		}
		else
		{
			// Se fija si tiene datos de openAuth
			$data = OauthData::DeserializeFromSession();
			if($data == null)
			{	// No los tiene... sale.
				return $this->Show(true);
			}
			// Los procesa
			$account = self::ProcessLogin($data->email, false, $data);
			$returnUrl = PhpSession::GetSessionValue($data->provider . 'OauthReturnUrl');
			OauthData::ClearSession();
		}
		return self::JumpToLoginUrl($returnUrl);
	}

	public static function JumpToLoginUrl($returnUrl)
	{
		if(Str::StartsWith($returnUrl, '/') == false && Str::StartsWith($returnUrl, 'http') == false)
			$returnUrl = '/' . $returnUrl;

		if ($returnUrl == '/' || Str::StartsWithI($returnUrl, '/login.do') || $returnUrl == '')
			return Session::GoProfile();
		else
			return App::Redirect($returnUrl);
	}

	public static function ProcessLogin($user, $checkPassword = true, $oauthData = null)
	{
		$user = Str::ToLower(trim($user));
		if ($user == '')
			MessageBox::ThrowMessage('Debe indicarse una cuenta para ingresar.');

		$account = new Account();
		$account->user = $user;
		if ($account->Exists() == false)
		{
			if ($checkPassword)
				MessageBox::ThrowMessage('Cuenta inexistente (' . $user . ').');
			else
				MessageBox::ThrowMessage('La cuenta <b>' . $user . '</b> no se encuentra registrada en el sitio. Para utilizarla debe completar previamente la registración.');
		}

		if($account->IsActive() == false)
		{
			MessageBox::ThrowMessage('La cuenta debe ser activada antes de poder ser utilizada. Verifique en su casilla de correo por el mensaje de activación.');
		}

		if($checkPassword)
		{
			$password = Params::SafeGet('password');
			if ($account->Login($password) == false)
			{
				MessageBox::ThrowMessage('Usuario no encontrado o contraseña incorrecta.');
			}

			if(Params::SafeGet('remember') != '')
				Remember::SetRemember($account);
		}
		else
		{
			if($oauthData != null
				&& $account->GetOauthId($oauthData->provider) == '')
				$account->SaveOauthActivation($oauthData, false);

			$account->Begin();
			Remember::SetRemember($account);
		}
		return $account;
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
