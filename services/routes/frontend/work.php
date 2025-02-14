<?php

use Symfony\Component\HttpFoundation\Request;
use helena\entities\frontend\geometries\Coordinate;
use helena\entities\frontend\geometries\Circle;

use helena\services\frontend as services;
use helena\services\common as commonServices;
use helena\services\backoffice\InstitutionService;

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;

// http://mapas.aacademica.org/services/download/GetDatasetFile?t=ss&l=8&r=1692&a=X
App::$app->get('/services/download/GetDatasetFile', function (Request $request) {
	$datasetId = Params::GetIntMandatory('d');
	$compareDatasetId = Params::GetInt('p');
	$workId = Params::GetIntMandatory('w');
	$clippingItemId = Params::GetIntArray('r');
	$clippingCircle = Circle::TextDeserialize(Params::Get('c'));
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	$partition = Params::GetInt('g');

	$type = Params::Get('t');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return services\DownloadDatasetService::GetFileBytes($type, $workId, $datasetId, $compareDatasetId, $clippingItemId, $clippingCircle, $urbanity, $partition);
});

// http://mapas.aacademica.org/services/download/StartDatasetDownload?t=ss&l=8&r=1692&a=X&k=
App::$app->get('/services/download/StartDatasetDownload', function (Request $request) {
	$controller = new services\DownloadDatasetService();
	$datasetId = Params::GetInt('d');
	$compareDatasetId = Params::GetInt('p');

	$clippingCircle = Circle::TextDeserialize(Params::Get('c'));
	$clippingItemId = Params::GetIntArray('r');
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	$partition = Params::GetInt('g');

	$type = Params::Get('t');

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByDataset($datasetId)) return $denied;

	return App::Json($controller->CreateMultiRequestFile($type, $datasetId, $compareDatasetId, $clippingItemId, $clippingCircle, $urbanity, $partition));
});

App::$app->get('/services/download/StepDatasetDownload', function (Request $request) {
	$controller = new services\DownloadDatasetService();
	$key = Params::Get('k');
	return App::Json($controller->StepMultiRequestFile($key));
});

// ej. http://mapas/services/works/GetWorkAndDefaultFrame?w=12
App::$app->get('/services/works/GetWorkAndDefaultFrame', function (Request $request) {
	$controller = new services\WorkService();
	$workId = Params::GetInt('w');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;
	$work = $controller->GetWork($workId);
	if ($work->Startup->Type == 'R' && $work->Startup->ClippingRegionItemId === null)
		$work->Startup->Type = 'D';

	if ($work->Startup->Type === 'D' ||
				($work->Startup->Type === 'E' && !$work->Extents))
	{
		$controller = new services\ClippingService();
		$paramCoordinate = Params::Get('p');
		$coordinate = Coordinate::TextDeserialize($paramCoordinate);
		$frame = $controller->GetDefaultFrame($coordinate);
	}
	else
	{
		$frame = null;
	}
	return App::Json(['work' => $work, 'frame' => $frame]);
});


// ej. http://mapas/services/works/GetWork?w=12
App::$app->get('/services/works/GetWork', function (Request $request) {
	$controller = new services\WorkService();
	$workId = Params::GetInt('w');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return App::Json($controller->GetWork($workId));
});


// ej. http://mapas/services/metadata/GetWorkMetadataDictionary?w=12&f=4
App::$app->get('/services/metadata/GetWorkMetadataDictionary', function (Request $request) {
	$controller = new commonServices\MetadataService();
	$metadataId = Params::GetIntMandatory('m');
	$workId = Params::GetIntMandatory('w');
	$datasetId = Params::GetIntMandatory('d', null);
	Session::$AccessLink = Params::Get('l');
	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return $controller->GetXlsDictionary($metadataId, $datasetId, $workId);
});

App::$app->get('/services/works/GetInstitutionWatermark', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;
	$watermarkId = Params::GetIntMandatory('iwmid');
	$controller = new InstitutionService();
	return $controller->GetInstitutionWatermark($watermarkId, false);
});

// ej. http://mapas/services/works/GetWorkImage?w=12
App::$app->get('/services/works/GetWorkImage', function (Request $request) {
	$controller = new services\WorkService();
	$workId = Params::GetInt('w');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return $controller->GetWorkImage($workId);
});


// ej. http://mapas/services/shapes/GetDatasetShapes?a=62&z=12&x=1380&y=2468
App::$app->get('/services/frontend/shapes/GetDatasetShapes', function (Request $request) {
	$controller = new services\ShapesService();
	$datasetId = Params::GetInt('d');
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntRangeMandatory('z', 0, 23);

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByDataset($datasetId)) return $denied;

	return App::JsonImmutable($controller->GetDatasetShapes($datasetId, $x, $y, $z));
});


App::$app->get('/services/frontend/work/GetOnboardingStepImage', function (Request $request) {
	$controller = new services\WorkService();
	$workId = Params::GetIntMandatory('w');
	$fileId = Params::GetIntMandatory('f');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId))
		return $denied;

	return App::JsonImmutable($controller->GetOnboardingStepImage($workId, $fileId));
});


App::$app->get('/services/backoffice/', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId))
		return $denied;
	$step = Params::GetIntMandatory('s');
	$controller = new services\OnboardingService();
	return $controller->GetStepImage($workId, $step);
});

