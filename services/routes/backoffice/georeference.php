<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;

use helena\services\backoffice as services;
use minga\framework\Params;


// ********************************* Servicios *********************************

// ******* Georreferenciación *********************************

App::Get('/services/backoffice/CreateMultiGeoreferenceByLatLong', function (Request $request) {
	$controller = new services\GeoreferenceService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$geographyId = Params::GetIntMandatory('a');
	$latColumnId = Params::GetIntMandatory('lat');
	$lonColumnId = Params::GetIntMandatory('lon');

	$reset = Params::Get('r');
	return App::Json($controller->CreateMultiGeoreferenceByLatLong($datasetId, $geographyId, $latColumnId, $lonColumnId, $reset));
});

App::Get('/services/backoffice/CreateMultiGeoreferenceByCodes', function (Request $request) {
	$controller = new services\GeoreferenceService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$geographyId = Params::GetIntMandatory('a');
	$codesColumnId = Params::GetIntMandatory('c');
	$reset = Params::Get('r');
	return App::Json($controller->CreateMultiGeoreferenceByCodes($datasetId, $geographyId, $codesColumnId, $reset));
});

App::$app->get('/services/backoffice/GetAllGeographies', function (Request $request) {
	$controller = new services\GeographyService();
	return App::OrmJson($controller->GetAllGeographies());
});

App::Get('/services/backoffice/CreateMultiGeoreferenceByShapes', function (Request $request) {
	$controller = new services\GeoreferenceService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$geographyId = Params::GetIntMandatory('a');
	$shapesColumnId = Params::GetIntMandatory('c');
	$reset = Params::Get('r');
	return App::Json($controller->CreateMultiGeoreferenceByShapes($datasetId, $geographyId, $shapesColumnId, $reset));
});

App::Get('/services/backoffice/StepMultiGeoreference', function (Request $request) {
	$controller = new services\GeoreferenceService();
	$key = Params::GetMandatory('k');
	return App::Json($controller->StepMultiGeoreference($key));
});


App::$app->get('/services/backoffice/GetGeographyItems', function (Request $request) {
	$controller = new services\GeographyService();
	$geographyId = Params::GetIntMandatory('g');
	return App::OrmJson($controller->GetGeographyItems($geographyId));
});
