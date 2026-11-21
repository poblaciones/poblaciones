<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\packs as services;
use minga\framework\Params;
use helena\entities\backoffice as entities;


// ********************************* Servicios *********************************

App::Get('/services/packs/GetBasemapLayers', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\BasemapLayerService();
	$ret = $controller->GetBasemapLayers();
	return App::OrmJson($ret);
});

App::Get('/services/packs/SearchBasemapMetrics', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$query = Params::Get('q', '');
	$controller = new services\BasemapLayerService();
	$ret = $controller->SearchPublishedMetrics($query);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/UpdateBasemapLayer', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$layer = App::ReconnectJsonParamMandatory(entities\BasemapLayer::class, 'l');
	// HasOwnMetadata no es una propiedad de la entidad: se lee del JSON crudo.
	$raw = Params::GetJsonMandatory('l', true);
	$hasOwnMetadata = false;
	if (isset($raw['HasOwnMetadata']))
	{
		$hasOwnMetadata = (bool)$raw['HasOwnMetadata'];
	}

	$controller = new services\BasemapLayerService();
	$ret = $controller->UpdateBasemapLayer($layer, $hasOwnMetadata);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/DeleteBasemapLayer', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$layerId = Params::GetIntMandatory('l');
	$layer = App::Orm()->find(entities\BasemapLayer::class, $layerId);

	$controller = new services\BasemapLayerService();
	$ret = $controller->DeleteBasemapLayer($layer);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/MoveBasemapLayerUp', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$layerId = Params::GetIntMandatory('l');

	$controller = new services\BasemapLayerService();
	$ret = $controller->MoveBasemapLayerUp($layerId);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/MoveBasemapLayerDown', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$layerId = Params::GetIntMandatory('l');

	$controller = new services\BasemapLayerService();
	$ret = $controller->MoveBasemapLayerDown($layerId);
	return App::Json($ret);
});
