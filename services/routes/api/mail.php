<?php

use Symfony\Component\HttpFoundation\Request;
use helena\services\api as services;

use helena\classes\App;
use minga\framework\Params;

// ej. http://mapas/services/api/v3/mail/send?v=1&s=<key>
App::$app->post('/services/api/v3/mail/send', function (Request $request) {

	$controller = new services\MailService();

	$ret = $controller->Send();

	return $ret;
});
