<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\App;
use minga\framework\Context;
use minga\framework\PublicException;
use minga\framework\Params;

class cWinLogin extends cController
{
	public function Show()
	{
		$this->CheckIsLocalCall();
		$user = Params::GetMandatory('u');
		$login = cLoginAjax::ProcessLogin($user);
		if (Session::IsMegaUser() === false)
		{
			Session::Logoff();
			throw new PublicException('El usuario debe ser administrador.');
		}
		if ($login !== "ok")
			throw new PublicException($login);

		$ret = array();
		$extra = array();
		$ret['done'] = true;
		$ret['key'] = '1';
		$ret['status'] = 'Completo';
		$ret['step'] = 1;
		$ret['totalSteps'] = 1;
		$extra['Server'] = Context::Settings()->Db()->Host;
		$extra['Database'] = Context::Settings()->Db()->Name;
		$extra['DatabaseType'] = 'MySql';
		$extra['User'] = Context::Settings()->Db()->User;
		$extra['SslMode'] = 'Required';
		$extra['PasswordPlain'] = Context::Settings()->Db()->Password;

		$ret['extra'] = json_encode($extra);
		return App::Json($ret);
	}

	public function Post()
	{

	}

	private function CheckIsLocalCall()
	{
		$localList = array(
				'127.0.0.1',
				'::1'
		);
		$whiteList = array_merge($localList, Context::Settings()->Servers()->RemoteLoginWhiteList);
		if(!in_array($_SERVER['REMOTE_ADDR'], $whiteList)){
			throw new PublicException('El método debe ser invocado localmente o desde una dirección permitida en el archivo de configuración del servidor (Context::Settings()->Servers()->RemoteLoginWhiteList = array(.., ..)).');
		}
	}
}
