<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use minga\framework\Params;
use helena\classes\Session;
use helena\services\common as services;

App::$app->get('/services/authentication/status', function (Request $request) {
	$authentication = new services\AuthenticationService();
	return App::Json($authentication->GetStatus());
});

App::$app->get('/services/authentication/logoff', function (Request $request) {
	Session::Logoff();
	return App::Json(array('logged' => false));
});

App::$app->get('/services/authentication/secretdata', function () {
	$user = App::$app['session']->get('user');
	if ($user === null)
		return App::Json(array('logged' => false));

	$data = array();
	for($i = 0; $i < 10; $i++)
		$data[] = array('name' => 'name'.$i, 'value' => rand(100,1000));

	return App::Json(array('data' => $data, 'user' => $user['user'], 'logged' => true));
});
