<?php

use Symfony\Component\HttpFoundation\Request;
use helena\services\frontend as services;

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;
use helena\entities\frontend\geometries\Frame;
use helena\entities\frontend\geometries\Circle;


// ej. http://mapas/boundaries/GetSelectedBoundary?a=62
App::$app->get('/services/boundaries/GetSelectedBoundary', function (Request $request) {
	$controller = new services\BoundaryService();
	$boundaryId = Params::GetIntMandatory('a');

	if ($denied = Session::CheckIsBoundaryPublicOrAccessible($boundaryId)) return $denied;
	$ret = $controller->GetSelectedBoundary($boundaryId);

	return App::Json($ret);
});

// ej. http://mapas/services/boundaries/GetBoundary?a=62&z=12&x=1380&y=2468
App::$app->get('/services/frontend/boundaries/GetBoundary', function (Request $request) {
	$controller = new services\BoundaryService();
	$boundaryId = Params::GetIntMandatory('a');

	if ($denied = Session::CheckIsBoundaryPublicOrAccessible($boundaryId)) return $denied;

	//$frame = Frame::FromTileParams();
	$frame = Frame::FromTileParams();

	$frame->ClippingRegionIds = null;
	$frame->ClippingCircle = null;

	$ret = $controller->GetBoundary($frame, $boundaryId);

	return App::JsonImmutable($ret);
});

// ej. http://mapas//services/frontend/boundaries/GetBoundarySummary?b=8&r=7160
App::$app->get('/services/frontend/boundaries/GetBoundarySummary', function (Request $request) {
	$controller = new services\BoundaryService();
	$boundaryId = Params::GetIntMandatory('b');
	$frame = Frame::FromParams();

	if ($denied = Session::CheckIsBoundaryPublicOrAccessible($boundaryId)) return $denied;

	return App::JsonImmutable($controller->GetSummary($frame, $boundaryId));
});

// http://mapas.aacademica.org/services/download/GetBoundaryFile?t=ss&l=8&r=1692&a=X
App::$app->get('/services/download/GetBoundaryFile', function (Request $request) {
	$boundaryId = Params::GetIntMandatory('b');
	$type = Params::Get('t');
	$clippingItemId = Params::GetIntArray('r');
	$clippingCircle = Circle::TextDeserialize(Params::Get('c'));

	if ($denied = Session::CheckIsBoundaryPublicOrAccessible($boundaryId)) return $denied;

	return services\DownloadBoundaryService::GetFileBytes($type, $boundaryId, $clippingItemId, $clippingCircle);
});

// http://mapas.aacademica.org/services/download/StartBoundaryDownload?t=ss&l=8&r=1692&a=X&k=
App::$app->get('/services/download/StartBoundaryDownload', function (Request $request) {
	$controller = new services\DownloadBoundaryService();
	$boundaryId = Params::GetInt('b');
	$type = Params::Get('t');
	$clippingCircle = Circle::TextDeserialize(Params::Get('c'));
	$clippingItemId = Params::GetIntArray('r');

	if ($denied = Session::CheckIsBoundaryPublicOrAccessible($boundaryId)) return $denied;

	return App::Json($controller->CreateMultiRequestFile($type, $boundaryId, $clippingItemId, $clippingCircle));
});

App::$app->get('/services/download/StepBoundaryDownload', function (Request $request) {
	$controller = new services\DownloadBoundaryService();
	$key = Params::Get('k');
	return App::Json($controller->StepMultiRequestFile($key));
});


