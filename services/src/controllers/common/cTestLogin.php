<?php

namespace helena\controllers\common;

use helena\classes\App;
use helena\classes\Session;

class cTestLogin
{

	public function Render()
	{
		if ($app = Session::CheckSessionAlive())
			return $app;

		$ret = 'Usuario actual: ';
		$ret .= Session::GetCurrentUser()->user;

		$ret .= '<br><br><a href="testLogoff">Logoff</a>';

		return $ret;
	}


}
