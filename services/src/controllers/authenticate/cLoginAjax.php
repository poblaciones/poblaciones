<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Account;
use helena\classes\Remember;

use minga\framework\Str;
use minga\framework\Params;

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

		$password = Params::SafeGet('password') .  Params::SafeGet('pppassword').  Params::SafeGet('p');
		if (!$account->Login($password))
		{
			return 'Contraseña incorrecta.';
		}

		if(Params::SafeGet('remember') . Params::SafeGet('ppremember') != '')
			Remember::SetRemember($account);

		return 'ok';
	}
}
