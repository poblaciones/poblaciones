<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\packs as services;
use minga\framework\Params;
use helena\entities\backoffice as entities;


// ********************************* Servicios *********************************

App::Get('/services/packs/GetGradients', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\GradientService();
	$ret = $controller->GetGradients();
	return App::OrmJson($ret);
});

App::GetOrPost('/services/packs/UpdateGradient', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$gradient = App::ReconnectJsonParamMandatory(entities\Gradient::class, 'g');

	$controller = new services\GradientService();
	$ret = $controller->UpdateGradient($gradient);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/DeleteGradient', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$gradientId = Params::GetIntMandatory('g');
	$gradient = App::Orm()->find(entities\Gradient::class, $gradientId);

	$controller = new services\GradientService();
	$ret = $controller->DeleteGradient($gradient);
	return App::Json($ret);
});

App::Get('/services/packs/VerifyGradientPackage', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$bucketId = Params::GetMandatory('b');

	$controller = new services\GradientService();
	$ret = $controller->VerifyGradientPackage($bucketId);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/StartImportGradient', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$gradient = App::ReconnectJsonParamMandatory(entities\Gradient::class, 'g');
	$bucketId = Params::GetMandatory('b');

	$controller = new services\GradientService();
	$ret = $controller->StartImportGradient($gradient, $bucketId);
	return App::Json($ret);
});

App::Get('/services/packs/StepImportGradient', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$key = Params::GetMandatory('k');

	$controller = new services\GradientService();
	$ret = $controller->StepImportGradient($key);
	return App::Json($ret);
});
