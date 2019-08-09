<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\backoffice as services;
use minga\framework\Params;
use minga\framework\ErrorException;
use helena\entities\backoffice as entities;

// Backoffice


// ********************************* Servicios *********************************

// ******* Administración *********************************


App::GetOrPost('/services/backoffice/UpdateUser', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$user = App::ReconnectJsonParamMandatory(entities\User::class, 'u');
	$controller = new services\AdministrationService();
	$ret = $controller->UpdateUser($user);
	return App::Json($ret);
});

App::Get('/services/backoffice/GetUsers', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$controller = new services\AdministrationService();
	$ret = $controller->GetUsers();
	return App::Json($ret);
});

App::Get('/services/backoffice/LoginAs', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$userId = Params::GetIntMandatory('u');
	$controller = new services\AdministrationService();
	$ret = $controller->LoginAs($userId);
	return App::Json($ret);
});

App::Get('/services/backoffice/DeleteUser', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;

	$userId = Params::GetIntMandatory('u');
	$controller = new services\AdministrationService();
	$ret = $controller->DeleteUser($userId);
	return App::Json($ret);
});

