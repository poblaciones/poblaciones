<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\packs as services;
use minga\framework\Params;
use helena\entities\backoffice as entities;


// ********************************* Servicios *********************************

App::Get('/services/packs/GetGeographies', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\GeographyService();
	$ret = $controller->GetGeographies();
	return App::OrmJson($ret);
});

App::GetOrPost('/services/packs/UpdateGeography', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$geography = App::ReconnectJsonParamMandatory(entities\Geography::class, 'g');

	$controller = new services\GeographyService();
	$ret = $controller->UpdateGeography($geography);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/DeleteGeography', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$geographyId = Params::GetIntMandatory('g');
	$geography = App::Orm()->find(entities\Geography::class, $geographyId);

	$controller = new services\GeographyService();
	$ret = $controller->DeleteGeography($geography);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/StartImportGeography', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$geography = App::ReconnectJsonParamMandatory(entities\Geography::class, 'g');
	$bucketId = Params::GetMandatory('b');
	$mapping = Params::GetJsonMandatory('m', true);

	$controller = new services\GeographyService();
	$ret = $controller->StartImportGeography($geography, $bucketId, $mapping);
	return App::Json($ret);
});

App::Get('/services/packs/StepImportGeography', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$key = Params::GetMandatory('k');

	$controller = new services\GeographyService();
	$ret = $controller->StepImportGeography($key);
	return App::Json($ret);
});
