<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\backoffice as services;
use minga\framework\Params;

// Operaciones sobre la cuenta del usuario autenticado.
// A diferencia de permission.php, estas rutas no operan sobre una cartografía
// sino sobre el propio usuario, por lo que solo requieren sesión iniciada.

App::$app->get('/services/backoffice/GetCurrentUserAccount', function (Request $request) {
	if ($denied = Session::CheckSessionAlive()) return $denied;

	$controller = new services\UserService();
	return App::Json($controller->GetCurrentUserAccount());
});

App::$app->get('/services/backoffice/GetCurrentUserDiskUsage', function (Request $request) {
	if ($denied = Session::CheckSessionAlive())
		return $denied;

	$controller = new services\UserService();
	return App::Json($controller->GetCurrentUserDiskUsage());
});

App::$app->post('/services/backoffice/UpdateCurrentUserName', function (Request $request) {
	if ($denied = Session::CheckSessionAlive()) return $denied;

	$controller = new services\UserService();
	$firstname = Params::GetMandatory('f');
	$lastname = Params::GetMandatory('l');
	return App::Json($controller->UpdateCurrentUserName($firstname, $lastname));
});

App::$app->post('/services/backoffice/ChangeCurrentUserPassword', function (Request $request) {
	if ($denied = Session::CheckSessionAlive()) return $denied;

	$controller = new services\UserService();
	$current = Params::GetMandatory('c');
	$new = Params::GetMandatory('n');
	$verification = Params::GetMandatory('v');
	return App::Json($controller->ChangeCurrentUserPassword($current, $new, $verification));
});

App::$app->post('/services/backoffice/DeleteCurrentUserAccount', function (Request $request) {
	if ($denied = Session::CheckSessionAlive()) return $denied;

	$controller = new services\UserService();
	return App::Json($controller->DeleteCurrentUser());
});
