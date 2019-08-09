<?php
namespace helena\controllers\authenticate;

use minga\framework\oauth\OauthFacebook;


class cOauthFacebook extends cOauth
{
	public function __construct()
	{
		$this->oauth = new OauthFacebook();
	}
}
