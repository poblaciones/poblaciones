<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\backoffice as services;
use minga\framework\Params;
use minga\framework\PublicException;

// Backoffice


// ********************************* Servicios *********************************

// ******* Permisos *********************************

App::$app->get('/services/backoffice/GetConfiguration', function (Request $request) {
	$configuration = new services\ConfigurationService();
	return App::Json($configuration->GetConfiguration());
});

App::$app->post('/services/backoffice/SetUserSetting', function (Request $request) {
	$key = Params::GetMandatory('k');
	$value = Params::GetJsonMandatory('v', true);
	$configuration = new services\ConfigurationService();
	return App::Json($configuration->SetUserSetting($key, $value));
});

App::$app->get('/services/backoffice/GetWorkPermissions', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$controller = new services\PermissionsService();
	$ret = $controller->GetPermissions($workId);
	return App::OrmJson($ret);
});

App::$app->get('/services/backoffice/AddWorkPermission', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\PermissionsService();
	$userEmail = Params::GetMandatory('u');
	$permission = Params::GetMandatory('p');
	$notify = Params::GetBoolMandatory('n');
	if ($permission != 'V' && $permission != 'E' && $permission != 'A')
	 throw new PublicException('Tipo de permiso inválido');
	$ret = $controller->AssignPermission($workId, $userEmail, $permission, $notify);
	return App::OrmJson($ret);
});

App::$app->get('/services/backoffice/RemoveWorkPermission', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\PermissionsService();
	$permissionId = Params::GetInt('p');
	$ret = $controller->RemovePermission($workId, $permissionId);
	return App::Json($ret);
});

