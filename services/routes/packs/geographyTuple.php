<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\packs as services;
use minga\framework\Params;
use helena\entities\backoffice as entities;


// ********************************* Servicios *********************************

App::Get('/services/packs/GetGeographyTuples', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\GeographyTupleService();
	$ret = $controller->GetGeographyTuples();
	return App::OrmJson($ret);
});

App::GetOrPost('/services/packs/UpdateGeographyTuple', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$tuple = App::ReconnectJsonParamMandatory(entities\GeographyTuple::class, 't');

	$controller = new services\GeographyTupleService();
	$ret = $controller->UpdateGeographyTuple($tuple);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/DeleteGeographyTuple', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$tupleId = Params::GetIntMandatory('t');
	$tuple = App::Orm()->find(entities\GeographyTuple::class, $tupleId);

	$controller = new services\GeographyTupleService();
	$ret = $controller->DeleteGeographyTuple($tuple);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/StartCalculateGeographyTuple', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$tupleId = Params::GetIntMandatory('t');

	$controller = new services\GeographyTupleService();
	$ret = $controller->StartCalculateGeographyTuple($tupleId);
	return App::Json($ret);
});

App::Get('/services/packs/StepCalculateGeographyTuple', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$key = Params::GetMandatory('k');

	$controller = new services\GeographyTupleService();
	$ret = $controller->StepCalculateGeographyTuple($key);
	return App::Json($ret);
});

App::Get('/services/packs/GetGeographyTupleCalculatedItems', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$tupleId = Params::GetIntMandatory('t');
	$offset = Params::GetIntMandatory('o');
	$limit = Params::GetIntMandatory('l');

	$controller = new services\GeographyTupleService();
	$ret = $controller->GetGeographyTupleCalculatedItems($tupleId, $offset, $limit);
	return App::Json($ret);
});
