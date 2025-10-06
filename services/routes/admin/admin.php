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

App::GetOrPost('/services/admin/UpdateClippingRegion', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$region = App::ReconnectJsonParamMandatory(entities\ClippingRegion::class, 'r');

	$controller = new services\ClippingRegionService();
	$ret = $controller->UpdateClippingRegion($region);
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

App::Get('/services/admin/GetMetadata', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\MetadataService();
	$metadataId = Params::GetIntMandatory('m');
	$ret = $controller->GetMetadata($metadataId);
	return App::OrmJson($ret);
});


App::Get('/services/admin/GetClippingRegions', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\ClippingRegionService();
	$ret = $controller->GetClippingRegions();
	return App::OrmJson($ret);
});


App::GetOrPost('/services/admin/UpdateClippingRegion', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$region = App::ReconnectJsonParamMandatory(entities\ClippingRegion::class, 'r');

	$controller = new services\ClippingRegionService();
	$ret = $controller->UpdateClippingRegion($region);
	return App::Json($ret);
});

App::Get('/services/admin/GetBoundaries', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\BoundaryService();
	$ret = $controller->GetBoundaries();
	return App::OrmJson($ret);
});

App::Get('/services/admin/GetBoundaryGroups', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\BoundaryService();
	$ret = $controller->GetBoundaryGroups();
	return App::OrmJson($ret);
});

App::GetOrPost('/services/admin/UpdateBoundary', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$boundary = App::ReconnectJsonParamMandatory(entities\Boundary::class, 'b');

	$controller = new services\BoundaryService();
	$ret = $controller->UpdateBoundary($boundary);
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

App::Get('/services/admin/ClearMetadataPdfCache', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new CacheManager();
	$metadataId = Params::GetMandatory('m');
	$ret = $controller->CleanPdfMetadata($metadataId);
	return App::Json(["result" => "OK"]);
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