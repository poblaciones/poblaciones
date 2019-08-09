<?php

namespace helena\controllers\common;

use helena\classes\App;
use helena\classes\Session;


class cTestLogoff
{

	public function Render()
	{
		Session::Logoff();

		$ret = 'Usuario actual: ';
		$ret .= Session::GetCurrentUser()->user;

		$ret .= '<br><br><a href="testLogin">Ir a página que requiere autenticación</a>';

		return $ret;
	}


}
