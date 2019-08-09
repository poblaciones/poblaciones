<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Links;
use helena\classes\Session;
use helena\classes\App;

use minga\framework\Context;
use minga\framework\Str;
use minga\framework\Params;

class cLogoff extends cController
{
	public function Show()
	{
		Session::Logoff();

		return App::Redirect(Links::GetHomeUrl());
	}

	public function Post()
	{
	}
}
