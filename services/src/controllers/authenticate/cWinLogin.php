<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\App;
use helena\classes\Register;

use minga\framework\Context;
use minga\framework\ErrorException;
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
			throw new ErrorException('El usuario debe ser administrador.');
		}
		if ($login !== "ok")
			throw new ErrorException($login);

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
		$whitelist = array(
				'127.0.0.1',
				'::1'
		);
		if(!in_array($_SERVER['REMOTE_ADDR'], $whitelist)){
			throw new ErrorException('El método debe ser invocado localmente o desde una dirección permitida.');
		}
	}
}
