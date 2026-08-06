<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\packs as services;
use helena\services\backoffice as backofficeServices;
use minga\framework\Params;
use helena\services\backoffice\publish\CacheManager;
use helena\entities\backoffice as entities;


// ********************************* Servicios *********************************


App::GetOrPost('/services/packs/UpdateClippingRegion', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$region = App::ReconnectJsonParamMandatory(entities\ClippingRegion::class, 'r');

	$controller = new services\ClippingRegionService();
	$ret = $controller->UpdateClippingRegion($region);
	return App::Json($ret);
});


App::Get('/services/packs/GetClippingRegions', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\ClippingRegionService();
	$ret = $controller->GetClippingRegions();
	return App::OrmJson($ret);
});

App::GetOrPost('/services/packs/DeleteClippingRegion', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$regionId = Params::GetIntMandatory('r');
	$region = App::Orm()->find(entities\ClippingRegion::class, $regionId);

	$controller = new services\ClippingRegionService();
	$ret = $controller->DeleteClippingRegion($region);
	return App::Json($ret);
});

App::Get('/services/packs/VerifyGeoPackage', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$bucketId = Params::GetMandatory('b');

	$controller = new services\ClippingRegionService();
	$ret = $controller->VerifyGeoPackage($bucketId);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/StartImportClippingRegion', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$clippingRegion = App::ReconnectJsonParamMandatory(entities\ClippingRegion::class, 'c');
	$bucketId = Params::GetMandatory('b');
	$mapping = Params::GetJsonMandatory('m', true);

	$controller = new services\ClippingRegionService();
	$ret = $controller->StartImportClippingRegion($clippingRegion, $bucketId, $mapping);
	return App::Json($ret);
});

App::Get('/services/packs/StepImportClippingRegion', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$key = Params::GetMandatory('k');

	$controller = new services\ClippingRegionService();
	$ret = $controller->StepImportClippingRegion($key);
	return App::Json($ret);
});

App::Get('/services/packs/GetClippingRegionGeographies', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$regionId = Params::GetIntMandatory('r');

	$controller = new services\ClippingRegionService();
	$ret = $controller->GetClippingRegionGeographies($regionId);
	return App::Json($ret);
});

App::Get('/services/packs/GetGeographyClippingRegions', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$geographyId = Params::GetIntMandatory('g');

	$controller = new services\ClippingRegionService();
	$ret = $controller->GetGeographyClippingRegions($geographyId);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/StartCalculateGeographyClippingRegions', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$geographyId = Params::GetIntMandatory('g');
	$clippingRegionIds = Params::GetIntArray('r');

	$controller = new services\ClippingRegionService();
	$ret = $controller->StartCalculateGeographyClippingRegions($geographyId, $clippingRegionIds);
	return App::Json($ret);
});

App::Get('/services/packs/StepCalculateGeographyClippingRegions', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$key = Params::GetMandatory('k');

	$controller = new services\ClippingRegionService();
	$ret = $controller->StepCalculateGeographyClippingRegions($key);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/DeleteClippingRegionGeography', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$id = Params::GetIntMandatory('i');

	$controller = new services\ClippingRegionService();
	$ret = $controller->DeleteClippingRegionGeography($id);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/StartCalculateClippingRegionGeography', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$regionId = Params::GetIntMandatory('r');
	$geographyIds = Params::GetIntArray('g');

	$controller = new services\ClippingRegionService();
	$ret = $controller->StartCalculateClippingRegionGeography($regionId, $geographyIds);
	return App::Json($ret);
});

App::Get('/services/packs/StepCalculateClippingRegionGeography', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$key = Params::GetMandatory('k');

	$controller = new services\ClippingRegionService();
	$ret = $controller->StepCalculateClippingRegionGeography($key);
	return App::Json($ret);
});

App::Get('/services/packs/GetClippingRegionItems', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$regionId = Params::GetIntMandatory('r');
	$offset = Params::GetIntMandatory('o');
	$limit = Params::GetIntMandatory('l');

	$controller = new services\ClippingRegionService();
	$ret = $controller->GetClippingRegionItems($regionId, $offset, $limit);
	return App::Json($ret);
});

App::Get('/services/packs/GetClippingRegionGeographyIntersectionItems', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$crgId = Params::GetIntMandatory('c');
	$offset = Params::GetIntMandatory('o');
	$limit = Params::GetIntMandatory('l');

	$controller = new services\ClippingRegionService();
	$ret = $controller->GetClippingRegionGeographyIntersectionItems($crgId, $offset, $limit);
	return App::Json($ret);
});
