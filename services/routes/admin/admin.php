<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\admin as services;
use helena\services\backoffice as backofficeServices;
use minga\framework\Params;
use helena\services\backoffice\publish\CacheManager;
use helena\entities\backoffice as entities;

// Admins


// ********************************* Servicios *********************************

// ******* Administración *********************************


App::GetOrPost('/services/admin/UpdateUser', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$user = App::ReconnectJsonParamMandatory(entities\User::class, 'u');
	$password = Params::Get('p');
	$verification = Params::Get('v');

	$controller = new services\UserService();
	$ret = $controller->UpdateUser($user, $password, $verification);
	return App::Json($ret);
});


App::Get('/services/admin/GetWorks', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\WorkService();
	$filter = Params::GetMandatory('f');
	$timeFilter = Params::GetInt('t', 0);
	$ret = $controller->GetWorksByType($filter, $timeFilter);
	return App::Json($ret);
});

App::Get('/services/admin/UpdateWorkSpaceUsage', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\WorkService();
	$ret = $controller->UpdateWorkSpaceUsage();
	return App::Json($ret);
});

App::Get('/services/admin/GetUsers', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$controller = new services\UserService();
	$ret = $controller->GetUsers();
	return App::Json($ret);
});

App::Get('/services/admin/LoginAs', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$userId = Params::GetIntMandatory('u');
	$controller = new services\UserService();
	$ret = $controller->LoginAs($userId);
	return App::Json($ret);
});

App::Get('/services/admin/DeleteUser', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;

	$userId = Params::GetIntMandatory('u');
	$controller = new services\UserService();
	$ret = $controller->DeleteUser($userId);
	return App::Json($ret);
});

App::Get('/services/admin/UpdateWorkIndexing', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;

	$workId = Params::GetIntMandatory('w');
	$value = Params::GetBoolMandatory('v');
	$controller = new services\WorkService();
	$ret = $controller->UpdateWorkIndexing($workId, $value);
	return App::Json($ret);
});

App::Get('/services/admin/UpdateWorkSegmentedCrawling', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;

	$workId = Params::GetIntMandatory('w');
	$value = Params::GetBoolMandatory('v');
	$controller = new services\WorkService();
	$ret = $controller->UpdateWorkSegmentedCrawling($workId, $value);
	return App::Json($ret);
});

App::$app->get('/services/admin/ProcessAllStatistics', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$controller = new services\StatisticsService();
	$ret = $controller->ProcessAllStatistics();
	return App::Json($ret);
});

App::$app->get('/services/admin/ProcessStatistics', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\StatisticsService();
	$month = Params::GetMonthMandatory('m');
	$ret = $controller->ProcessStatistics($month);
	return App::Json($ret);
});

App::$app->get('/services/admin/GetStatistics', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\StatisticsService();
	$month = Params::GetMonth('m');
	$ret = $controller->GetStatistics($month);
	return App::OrmJson($ret);
});


App::Get('/services/admin/MarkTable', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$controller = new services\MarkUpdateTableService();
	$tablesString = Params::GetMandatory('t');
	$tables = explode(',', $tablesString);
	$controller->MarkTables($tables);
	return App::Json(["result" => "OK"]);
});

App::$app->get('/services/admin/GetUserKeys', function (Request $request) {
	if ($denied = Session::CheckIsMegaUser()) return $denied;

	$userId = Params::GetIntMandatory('u');

	$controller = new services\UserService();

	return App::Json($controller->GetUserKeys($userId));
});

App::$app->post('/services/admin/CreateUserKey', function (Request $request) {
	if ($denied = Session::CheckIsMegaUser()) return $denied;

	$userId      = Params::GetIntMandatory('u');
	$description = Params::GetMandatory('description');

	$controller = new services\UserService();
	return App::Json($controller->CreateUserKey($userId, $description));
});

App::$app->post('/services/admin/UpdateUserKey', function (Request $request) {
	if ($denied = Session::CheckIsMegaUser()) return $denied;

	$keyId      = Params::GetIntMandatory('key_id');
	$description = Params::Get('description');
	$active      = Params::GetInt('active');
	if ($description === null && $active === null) {
		throw new PublicException('Debe indicar al menos un campo a actualizar: description o active.');
	}
	$controller = new services\UserService();
	$controller->UpdateUserKey($keyId, $description, $active);

	return App::Json(['result' => 'ok']);
});

App::$app->get('/services/admin/DeleteUserKey', function (Request $request) {
	if ($denied = Session::CheckIsMegaUser()) return $denied;

	$keyId = Params::GetIntMandatory('key_id');

	$controller = new services\UserService();
	$controller->DeleteUserKey($keyId);

	return App::Json(['result' => 'ok']);
});
