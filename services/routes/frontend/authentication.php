<?php

use Symfony\Component\HttpFoundation\Request;

use helena\services\frontend as services;

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;


App::$app->get('/services/authentication/AccountExists', function (Request $request) {
	$user = Params::GetMandatory('u');
	$shouldBeActive = Params::GetBool('active');

	$controller = new services\AuthenticationService();
	$ret = $controller->AccountExists($user, $shouldBeActive);
	return App::Json($ret);
});

App::$app->post('/services/authentication/BeginResetPassword', function (Request $request) {
	$user = Params::GetMandatory('u');
	$to = Params::GetMandatory('t');

	$controller = new services\AuthenticationService();
	$ret = $controller->BeginResetPassword($user, $to);
	return App::Json($ret);
});

App::$app->get('/services/authentication/ValidateCode', function (Request $request) {
	$user = Params::GetMandatory('u');
	$code = Params::GetIntMandatory('c');

	$controller = new services\AuthenticationService();
	$ret = $controller->ValidateCode($user, $code);
	return App::Json($ret);
});


App::$app->post('/services/authentication/Login', function (Request $request) {
	$user = Params::GetMandatory('u');
	$password = Params::GetMandatory('p');

	$controller = new services\AuthenticationService();
	$ret = $controller->Login($user, $password);
	return App::Json($ret);
});

App::$app->post('/services/authentication/ResetPassword', function (Request $request) {
	$user = Params::GetMandatory('u');
	$password = Params::GetMandatory('p');
	$code = Params::GetIntMandatory('c');

	$controller = new services\AuthenticationService();
	$ret = $controller->ResetPassword($user, $password, $code);
	return App::Json($ret);
});

App::$app->post('/services/authentication/BeginActivation', function (Request $request) {
	$user = Params::GetMandatory('u');
	$to = Params::GetMandatory('t');

	$controller = new services\AuthenticationService();
	$ret = $controller->BeginActivation($user, $to);
	return App::Json($ret);
});

App::$app->post('/services/authentication/Activate', function (Request $request) {
	$user = Params::GetMandatory('u');
	$password = Params::GetMandatory('p');
	$code = Params::GetIntMandatory('c');
	$firstname = Params::GetMandatory('f');
	$lastname = Params::GetMandatory('l');
	$type = Params::GetMandatory('t');

	$controller = new services\AuthenticationService();
	$ret = $controller->Activate($user, $password, $code, $firstname, $lastname, $type);
	return App::Json($ret);
});
