<?php

namespace helena\controllers\authenticate;

use minga\framework\oauth\OauthGoogle;

class cOauthGoogle extends cOauth
{
	public function __construct()
	{
		$this->oauth = new OauthGoogle();
	}
}
