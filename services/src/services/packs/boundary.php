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

App::Get('/services/packs/GetBoundaries', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\BoundaryService();
	$ret = $controller->GetBoundaries();
	return App::OrmJson($ret);
});

App::Get('/services/packs/GetBoundaryGroups', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\BoundaryService();
	$ret = $controller->GetBoundaryGroups();
	return App::OrmJson($ret);
});

App::GetOrPost('/services/packs/UpdateBoundary', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$boundary = App::ReconnectJsonParamMandatory(entities\Boundary::class, 'b');

	$controller = new services\BoundaryService();
	$ret = $controller->UpdateBoundary($boundary);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/DeleteBoundary', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$boundaryId = Params::GetIntMandatory('b');
	$boundary = App::Orm()->find(entities\Boundary::class, $boundaryId);

	$controller = new services\BoundaryService();
	$ret = $controller->DeleteBoundary($boundary);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/UpdateBoundaryVersion', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$boundaryVersion = App::ReconnectJsonParamMandatory(entities\BoundaryVersion::class, 'v');
	// ClippingRegions no es una asociación Doctrine (ver BoundaryVersion::$ClippingRegions):
	// Reconnect no la sincroniza, así que los ids se leen aparte del JSON crudo.
	$raw = Params::GetJsonMandatory('v', true);
	$clippingRegionIds = array();
	if (isset($raw['ClippingRegions']) && is_array($raw['ClippingRegions']))
	{
		foreach ($raw['ClippingRegions'] as $region)
		{
			$clippingRegionIds[] = $region['Id'];
		}
	}
	$hasOwnMetadata = false;
	if (isset($raw['HasOwnMetadata']))
	{
		$hasOwnMetadata = (bool)$raw['HasOwnMetadata'];
	}

	$controller = new services\BoundaryService();
	$ret = $controller->UpdateBoundaryVersion($boundaryVersion, $clippingRegionIds, $hasOwnMetadata);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/MoveBoundaryUp', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$boundaryId = Params::GetIntMandatory('b');

	$controller = new services\BoundaryService();
	$ret = $controller->MoveBoundaryUp($boundaryId);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/MoveBoundaryDown', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$boundaryId = Params::GetIntMandatory('b');

	$controller = new services\BoundaryService();
	$ret = $controller->MoveBoundaryDown($boundaryId);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/DeleteBoundaryVersion', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$boundaryVersionId = Params::GetIntMandatory('v');
	$boundaryVersion = App::Orm()->find(entities\BoundaryVersion::class, $boundaryVersionId);

	$controller = new services\BoundaryService();
	$ret = $controller->DeleteBoundaryVersion($boundaryVersion);
	return App::Json($ret);
});
