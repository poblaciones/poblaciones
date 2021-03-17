<?php

use Symfony\Component\HttpFoundation\Request;
use helena\services\frontend as services;

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;

// ej. http://mapas/boundaries/GetSelectedBoundary?a=62
App::$app->get('/services/boundaries/GetSelectedBoundary', function (Request $request) {
	$controller = new services\BoundaryService();
	$boundaryId = Params::GetIntMandatory('a');
	$ret = $controller->GetSelectedBoundary($boundaryId);

	return App::Json($ret);
});

// ej. http://mapas/services/boundaries/GetBoundary?a=62&z=12&x=1380&y=2468
App::$app->get('/services/frontend/boundaries/GetBoundary', function (Request $request) {
	$controller = new services\BoundaryService();
	$boundaryId = Params::GetIntMandatory('a');
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	$b = Params::Get('b');
	$ret = $controller->GetBoundary($boundaryId, $x, $y, $z, $b);

	return App::JsonImmutable($ret);
});

// http://mapas.aacademica.org/services/download/GetBoundaryFile?t=ss&l=8&r=1692&a=X
App::$app->get('/services/download/GetBoundaryFile', function (Request $request) {
	$boundaryId = Params::GetIntMandatory('d');
	$type = Params::Get('t');

	if ($denied = Session::CheckIsBoundaryVisible($boundaryId)) return $denied;

	return services\DownloadBoundaryService::GetFileBytes($type, $boundaryId);
});

// http://mapas.aacademica.org/services/download/StartBoundaryDownload?t=ss&l=8&r=1692&a=X&k=
App::$app->get('/services/download/StartBoundaryDownload', function (Request $request) {
	$controller = new services\DownloadBoundaryService();
	$boundaryId = Params::GetInt('b');
	$type = Params::Get('t');

	if ($denied = Session::CheckIsBoundaryVisible($boundaryId)) return $denied;

	return App::Json($controller->CreateMultiRequestDatasetFile($type, $boundaryId));
});

App::$app->get('/services/download/StepBoundaryDownload', function (Request $request) {
	$controller = new services\DownloadBoundaryService();
	$key = Params::Get('k');
	return App::Json($controller->StepMultiRequestFile($key));
});


