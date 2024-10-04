<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\App;
use helena\classes\Account;
use helena\classes\Remember;

use minga\framework\IO;
use minga\framework\Str;
use minga\framework\PhpSession;
use minga\framework\Request;
use minga\framework\Performance;
use minga\framework\Params;
use minga\framework\WebConnection;

class cLoginAjax extends cController
{
	public function Show()
	{
	}

	public function Post()
	{
		// Login tradicional
		$username = Params::SafeGet('username') .  Params::SafeGet('ppusername');
		return self::ProcessLogin($username);
	}

	public static function ProcessLogin($user)
	{
		$user = Str::ToLower(trim($user));
		if ($user == "")
		{
			return 'Debe indicarse una cuenta para ingresar.';
		}
		$password = Params::SafeGet('password') . Params::SafeGet('pppassword') . Params::SafeGet('p');

		if (App::Settings()->Servers()->IsMainServerRequest() && !App::Settings()->Servers()->IsTransactionServerRequest())
			return self::remoteLogin($user, $password);
		else
			return self::localLogin($user, $password);
	}
	private static function remoteLogin($user, $password)
	{
		Performance::SetController('remoteLoginAjax', 'post', true);
		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$uri = $dynamicServer->publicUrl . Request::GetRequestURI();
		$args = ['username' => $user, 'password' => $password];

		$conn = new WebConnection();
		$conn->Initialize();
		$response = $conn->Post($uri, '', $args);
		$conn->Finalize();

		$ret = IO::ReadAllText($response->file);
		IO::Delete($response->file);
		if ($ret == 'ok')
		{
			$cookies = $response->headers['Set-Cookie'];
			$account = new Account();
			$account->user = $user;
			$account->BeginNoDb();
			PhpSession::SetSessionValue('RemoteCookieSessionId', $cookies);
		}
		return $ret;
	}

	private static function localLogin($user, $password)
	{

		$account = new Account();
		$account->user = $user;
		if ($account->Exists() == false)
		{
			return 'Cuenta inexistente (' . $user. ').';
		}

		if($account->IsActive() == false)
		{
			return'La cuenta debe ser activada antes de poder ser utilizada. Verifique en su casilla de correo por el mensaje de activación.';
		}
		if (!$account->Login($password))
		{
			return 'Contraseña incorrecta.';
		}

		if(Params::SafeGet('remember') . Params::SafeGet('ppremember') != '')
			Remember::SetRemember($account);

		return 'ok';
	}
}
