<?php

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

use helena\entities\frontend\geometries\Frame;
use helena\entities\frontend\geometries\Coordinate;
use helena\db\frontend\MetadataModel;

use helena\services\frontend as services;

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;

// MAPA
App::RegisterControllerGet('/', 'helena\controllers\frontend\cHome');
App::RegisterControllerGet('/map', 'helena\controllers\frontend\cMap');
App::RegisterControllerGet('/map/', 'helena\controllers\frontend\cMap');
// HOME INSTITUCIONAL
App::RegisterControllerGet('/home', 'helena\controllers\frontend\cHome');
App::RegisterControllerGet('/info', 'helena\controllers\frontend\cInfo');
App::RegisterControllerGet('/terms', 'helena\controllers\frontend\cTerms');
App::RegisterControllerGet('/privacy', 'helena\controllers\frontend\cPrivacy');
App::RegisterControllerGet('/research', 'helena\controllers\frontend\cResearch');
App::RegisterControllerGet('/public', 'helena\controllers\frontend\cPublic');
App::RegisterControllerGet('/community', 'helena\controllers\frontend\cCommunity');
App::RegisterControllerGetPost('/feedback', 'helena\controllers\frontend\cFeedback');
App::RegisterControllerGet('/send', 'helena\controllers\frontend\cSend');

// Parametros:
// De frame:
// - Zoom = 'z';
// - Envelope = 'e';
// - ClippingRegionId = 'r';
// - ClippingCircle = 'c';
// - ClippingFeatureId = 'f';
// Globales:
// - Metric: l
// - MetricVersion: v
// - Level: a
// - Key: k
// - Variable: i
// - Urbanity: u
// De download:
// - Type: t
//		case 'ss': // spss+shape,
//		case 'sg': // spss+geojson
//		case 'cg': // csv+geojson,
//		case 'cs': // csv+shape,




// http://mapas.aacademica.org/services/download/CreateFile?t=ss&l=8&r=1692&a=X&k=
// http://mapas.aacademica.org/services/download/CreateFile?k=e0UN2j
App::$app->get('/services/download/StartDownload', function (Request $request) {
	$controller = new services\DownloadService();
	$datasetId = Params::GetInt('d');
	$clippingItemId = Params::GetInt('r');
	$type = Params::Get('t');

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByDataset($datasetId)) return $denied;

	return App::Json($controller->CreateMultiRequestFile($type, $datasetId, $clippingItemId));
});

App::$app->get('/services/download/StepDownload', function (Request $request) {
	$controller = new services\DownloadService();
	$key = Params::Get('k');
	return App::Json($controller->StepMultiRequestFile($key));
});

App::$app->get('/services/download/TestFile', function (Request $request) {
	$controller = new services\DownloadService();
	$datasetId = Params::GetInt('d');
	$clippingItemId = Params::GetInt('r');
	$type = Params::Get('t');
	echo 'Starting...<br>';
	$status = $controller->CreateMultiRequestFile($type, $datasetId, $clippingItemId);
	$key = $status['key'];
	echo 'Started. Key: ' . $key . '<br>';
	while($status['done'] == false)
	{
		echo 'Step ' . $status['step'] . '. ' . $status['status'] . '<br>';
		$status = $controller->StepMultiRequestFile($key);
	}
	return "Done!";
});

// http://mapas.aacademica.org/services/download/GetFile?t=ss&l=8&r=1692&a=X
App::$app->get('/services/download/GetFile', function (Request $request) {
	$datasetId = Params::GetIntMandatory('d');
	$workId = Params::GetIntMandatory('w');
	$clippingItemId = Params::GetInt('r');
	$type = Params::Get('t');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return services\DownloadService::GetFileBytes($type, $workId, $datasetId, $clippingItemId);
});

App::$app->get('/services/search', function (Request $request) {
	$query = Params::Get('q');
	$controller = new services\LookupService($query);
	return App::Json($controller->Search());
});

App::$app->get('/services/clipping/GetDefaultFrame', function (Request $request) {
	$controller = new services\ClippingService();
	$paramCoordinate = Params::Get('p');
	$coordinate = Coordinate::TextDeserialize($paramCoordinate);
	return App::Json($controller->GetDefaultFrame($coordinate));
});

// ej. http://mapas/services/clipping/GetDefaultFrameAndClipping
App::$app->get('/services/clipping/GetDefaultFrameAndClipping', function (Request $request) {
	$controller = new services\ClippingService();
	$paramCoordinate = Params::Get('p');
	$coordinate = Coordinate::TextDeserialize($paramCoordinate);
	return App::Json($controller->GetDefaultFrameAndClipping($coordinate));
});

// ej. http://mapas/services/clipping/CreateClippingByName
App::$app->get('/services/clipping/CreateClippingByName', function (Request $request) {
	$controller = new services\ClippingService();
	$frame = Frame::FromParams();
	$levelName = Params::Get('n', null);
	return App::Json($controller->CreateClippingByName($frame, $levelName));
});

// ej. http://mapas/services/clipping/CreateClipping
App::$app->get('/services/clipping/CreateClipping', function (Request $request) {
	$controller = new services\ClippingService();
	$frame = Frame::FromParams();
	$levelId = Params::GetInt('a', 0);
	return App::Json($controller->CreateClipping($frame, $levelId));
});

// ej. http://mapas/services/metrics/GetSummary?l=8&v=12&a=62&r=7160
App::$app->get('/services/metrics/GetSummary', function (Request $request) {
	$controller = new services\SummaryService();
	$metricId = Params::GetInt('l');
	$metricVersionId = Params::GetInt('v');
	$levelId = Params::GetInt('a');
	$urbanity = Params::Get('u');
	$frame = Frame::FromParams();

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId)) return $denied;

	return App::Json($controller->GetSummary($frame, $metricId, $metricVersionId, $levelId, $urbanity));
});



App::$app->get('/services/metrics/GetInfoWindowData', function (Request $request) {
	$controller = new services\InfoWindowService();

	$metricId = Params::GetInt('l');
	$metricVersionId = Params::GetInt('v');
	$levelId = Params::GetInt('a');
	// f: puede ser un geographyId o un featureId (datasetId << 32 || id)
	$featureId = Params::Get('f');

	return App::Json($controller->GetInfo($featureId, $metricId, $metricVersionId, $levelId));
});

//TODO: Definir este servicio, parámetros etc..
// ej. http://mapas/services/metrics/GetData?f=134834
App::$app->get('/services/metrics/GetData', function (Request $request) {
	// $controller = new services\DataService();
	// $id = Params::GetInt('f');
	// return $controller->GetDataJson($id);
	$demo = array();
	for($i = 0; $i < rand(3,6); $i++)
		$demo[] = array('Name' => $i.'. Name'.rand(1, 100), 'Value' => 'Value'.rand(1, 100));

	return App::Json($demo);
});

// ej. http://mapas/services/works/GetWork?w=12
App::$app->get('/services/works/GetWork', function (Request $request) {
	$controller = new services\WorkService();
	$workId = Params::GetInt('w');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return App::Json($controller->GetWork($workId));
});

// ej. http://mapas/services/metadata/GetMetadataFile?m=12&f=4
App::$app->get('/services/metadata/GetMetadataFile', function (Request $request) {
	$controller = new services\MetadataService();
	$metadataId = Params::GetIntMandatory('m');
	$fileId = Params::GetIntMandatory('f');

	$model = new MetadataModel();
	$workId = $model->GetWorkIdByMetadataId($metadataId);
	if ($workId !== null && $denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return $controller->GetMetadataFile($metadataId, $fileId);
});

// ej. http://mapas/services/metadata/GetMetadataPdf?m=12&f=4
App::$app->get('/services/metadata/GetMetadataPdf', function (Request $request) {
	$controller = new services\MetadataService();
	$metadataId = Params::GetIntMandatory('m');
	$workId = Params::GetInt('w');
	$datasetId = Params::GetInt('d', null);

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return $controller->GetMetadataPdf($metadataId, $datasetId, false, $workId);
});

// ej. http://mapas/services/works/GetWorkImage?w=12
App::$app->get('/services/works/GetWorkImage', function (Request $request) {
	$controller = new services\WorkService();
	$workId = Params::GetInt('w');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return $controller->GetWorkImage($workId);
});

// ej. http://mapas/services/clipping/GetLabels?x=1382&y=2468&e=-34.569622,-58.257501%3B-34.667663,-58.608033&z=12&r=1692
App::$app->get('/services/clipping/GetLabels', function (Request $request) {
	$controller = new services\LabelsService();
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntMandatory('z');
	$b = Params::Get('b');
	return App::Json($controller->GetLabels($x, $y, $z, $b));
});

// ej. http://mapas/services/geographies/GetGeography?a=62&z=12&x=1380&y=2468
App::$app->get('/services/geographies/GetGeography', function (Request $request) {
	$controller = new services\GeographyService();
	$levelId = Params::GetIntMandatory('a');
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntMandatory('z');
	$p = Params::GetInt('p', 0);
	$b = Params::Get('b');
	$ret = $controller->GetGeography($levelId, $x, $y, $z, $b, $p);
	return App::Json($ret);
});

// ej. http://mapas/services/shapes/GetDatasetShapes?a=62&z=12&x=1380&y=2468
App::$app->get('/services/shapes/GetDatasetShapes', function (Request $request) {
	$controller = new services\ShapesService();
	$datasetId = Params::GetInt('d');
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntMandatory('z');
	$b = Params::Get('b');

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByDataset($datasetId)) return $denied;

	return App::Json($controller->GetDatasetShapes($datasetId, $x, $y, $z, $b));
});

// ej. http://mapas/services/metrics/GetTileData?l=8&v=12&a=62&z=12&x=1383&y=2470
App::$app->get('/services/metrics/GetTileData', function (Request $request) {
	//if (Str::Contains($_SERVER['REQUEST_URI'], '/services/metrics/GetTileData')) {
	//  echo GlobalTimer::EllapsedMs();
	$controller = new services\TileDataService();
	$metricId = Params::GetInt('l');
	$metricVersionId = Params::GetInt('v');

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId)) return $denied;

	$levelId = Params::GetInt('a');
	$urbanity = Params::Get('u');
	$frame = Frame::FromParams();
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntMandatory('z');
	$b = Params::Get('b');
	return App::Json($controller->GetTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z, $b));
});


App::$app->get('/services/metrics/GetFabMetrics', function (Request $request) {
	$controller = new services\MetricService();
	return $controller->GetFabMetricsJson();
});

App::$app->get('/services/metrics/GetSelectedMetric', function (Request $request) {
	$controller = new services\SelectedMetricService();

	$metricId = Params::GetInt('l');
	// ej. /services/metrics/GetSelectedMetric?l=8

	return $controller->GetSelectedMetricJson($metricId);
});

App::$app->get('/services/metrics/GetSelectedMetrics', function (Request $request) {
	$controller = new services\SelectedMetricService();

	$metricsId = Params::Get('l');
	// ej. /services/metrics/GetSelectedMetrics?l=8,9
	return $controller->GetSelectedMetricsJson($metricsId);
});


App::$app->get('/robots.txt', function(Request $request) {
	return
'User-agent: *
Disallow: /';
});

App::$app->error(function (\Exception $e, Request $request, $code) {
	if (App::Debug())
		return;

	// 404.html, or 40x.html, or 4xx.html, or error.html
	$templates = array(
		$code.'.html.twig',
		substr($code, 0, 2).'x.html.twig',
		substr($code, 0, 1).'xx.html.twig',
		'errDefault.html.twig',
	);

	$text = "";
	if ($e instanceof \minga\framework\MessageException || $e instanceof \minga\framework\ErrorException)
	{
		$text = $e->getPublicMessage();
		return new Response($text);
	}
	return new Response(App::RenderResolve($templates, array(
		'code' => $code,
		'title' => 'Error',
	)), $code);
});

