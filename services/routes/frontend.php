<?php

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

use helena\entities\frontend\geometries\Frame;
use helena\entities\frontend\geometries\Coordinate;
use helena\db\frontend\MetadataModel;

use helena\services\frontend as services;
use helena\controllers\frontend as controllers;
use helena\services\common as commonServices;

use helena\classes\GlobalTimer;
use helena\classes\App;
use helena\classes\Links;
use helena\classes\Session;
use minga\framework\Params;
use minga\framework\Context;

// CRAWLER
App::RegisterControllerGet('/sitemap', controllers\cSitemap::class);
App::RegisterControllerGet('/handle/{path1}', controllers\cHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}', controllers\cHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}/{path3}', controllers\cHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}/{path3}/{path4}', controllers\cHandle::class);
App::RegisterControllerGet('/handle/{path1}/{path2}/{path3}/{path4}/{path5}', controllers\cHandle::class);

App::RegisterControllerGet('/datasets', controllers\cDatasets::class);


// ej. http://mapas/map/3701/metadata
App::$app->get('/map/metadata', function (Request $request) {
	$controller = new commonServices\MetadataService();
	$workId = Params::CheckParseIntValue(Params::CheckMandatoryValue(Params::FromPath(2)));
	Session::$AccessLink = Params::Get('l');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	$workService = new services\WorkService();
	$work = $workService->GetWorkOnly($workId);
	$metadataId = $work->MetadataId;

	return $controller->GetMetadataPdf($metadataId, null, false, $workId);
});

// MAPA
App::RegisterControllerGet('/map', controllers\cMap::class);
App::RegisterControllerGet('/map/', controllers\cMap::class);
App::RegisterControllerGet('/map/{any}', controllers\cMap::class)->assert("any", ".*");

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
// - revision: w
// De download:
// - Type: t
//		case 'ss': // spss+shape,
//		case 'sg': // spss+geojson
//		case 'cg': // csv+geojson,
//		case 'cs': // csv+shape,


App::$app->get('/', function (Request $request) {
		return App::Redirect(Links::GetMapUrl());});

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

App::$app->get('/services/frontend/search', function (Request $request) {
	$query = Params::Get('q');
	$controller = new services\LookupService();
	$filter = Params::Get('f', '');
	$inBackoffice = Params::GetBool('b');

	return App::JsonImmutable($controller->Search($query, $filter, $inBackoffice));
});


App::$app->get('/services/clipping/GetDefaultFrame', function (Request $request) {
	$controller = new services\ClippingService();
	$paramCoordinate = Params::Get('p');
	$coordinate = Coordinate::TextDeserialize($paramCoordinate);
	return App::Json($controller->GetDefaultFrame($coordinate));
});

// ej. http://mapas/services/clipping/CreateClipping
App::$app->get('/services/frontend/clipping/CreateClipping', function (Request $request) {
	$controller = new services\ClippingService();
	$frame = Frame::FromParams();
	$levelId = Params::GetInt('a', 0);
	$levelName = Params::Get('n');
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	return App::JsonImmutable($controller->CreateClipping($frame, $levelId, $levelName, $urbanity));
});

// ej. http://mapas/services/metrics/GetSummary?l=8&v=12&a=62&r=7160
App::$app->get('/services/frontend/metrics/GetSummary', function (Request $request) {
	$controller = new services\SummaryService();
	$metricId = Params::GetIntMandatory('l');
	$metricVersionId = Params::GetIntMandatory('v');
	$levelId = Params::GetIntMandatory('a');
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	$frame = Frame::FromParams();

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId)) return $denied;

	return App::JsonImmutable($controller->GetSummary($frame, $metricId, $metricVersionId, $levelId, $urbanity));
});


// ej. http://mapas/services/metrics/GetRanking?l=8&v=12&a=62&r=7160&s=10
App::$app->get('/services/frontend/metrics/GetRanking', function (Request $request) {
	$controller = new services\RankingService();
	$metricId = Params::GetIntMandatory('l');
	$metricVersionId = Params::GetIntMandatory('v');
	$levelId = Params::GetIntMandatory('a');
	$variableId = Params::GetIntMandatory('i');
	$hasTotals = Params::GetBoolMandatory('t');
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	$frame = Frame::FromParams();
	$size = Params::GetIntRangeMandatory('s', 10, 100);
	$direction = Params::GetMandatory('d');

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId)) return $denied;

	return App::JsonImmutable($controller->GetRanking($frame, $metricId, $metricVersionId, $levelId, $variableId, $hasTotals, $urbanity, $size, $direction));
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

// ej. http://mapas/services/works/GetWorkAndDefaultFrame?w=12
App::$app->get('/services/works/GetWorkAndDefaultFrame', function (Request $request) {
	$controller = new services\WorkService();
	$workId = Params::GetInt('w');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;
	$work = $controller->GetWork($workId);

	if ($work->Startup->Type === 'D')
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

// ej. http://mapas/services/metadata/GetMetadataFile?m=12&f=4
App::$app->get('/services/metadata/GetMetadataFile', function (Request $request) {
	$controller = new commonServices\MetadataService();
	$metadataId = Params::GetIntMandatory('m');
	$fileId = Params::GetIntMandatory('f');

	$model = new MetadataModel();
	$workId = $model->GetWorkIdByMetadataId($metadataId);
	Session::$AccessLink = Params::Get('l');
	if ($workId !== null && $denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return $controller->GetMetadataFile($metadataId, $fileId);
});

// ej. http://mapas/services/metadata/GetMetadataPdf?m=12&f=4
App::$app->get('/services/metadata/GetMetadataPdf', function (Request $request) {
	$controller = new commonServices\MetadataService();
	$metadataId = Params::GetIntMandatory('m');
	$workId = Params::GetInt('w');
	$datasetId = Params::GetInt('d', null);
	Session::$AccessLink = Params::Get('l');

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
App::$app->get('/services/frontend/clipping/GetLabels', function (Request $request) {
	$controller = new services\LabelsService();
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	$b = Params::Get('b');
	return App::JsonImmutable($controller->GetLabels($x, $y, $z, $b));
});

// ej. http://mapas/services/geographies/GetGeography?a=62&z=12&x=1380&y=2468
App::$app->get('/services/frontend/geographies/GetGeography', function (Request $request) {
	$controller = new services\GeographyService();
	$levelId = Params::GetIntMandatory('a');
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	$p = Params::GetInt('p', 0);
	$b = Params::Get('b');
	$ret = $controller->GetGeography($levelId, $x, $y, $z, $b, $p);

	return App::JsonImmutable($ret);
});

// ej. http://mapas/services/shapes/GetDatasetShapes?a=62&z=12&x=1380&y=2468
App::$app->get('/services/frontend/shapes/GetDatasetShapes', function (Request $request) {
	$controller = new services\ShapesService();
	$datasetId = Params::GetInt('d');
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	$b = Params::Get('b');

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByDataset($datasetId)) return $denied;

	return App::JsonImmutable($controller->GetDatasetShapes($datasetId, $x, $y, $z, $b));
});

// ej. http://mapas/services/metrics/GetTileData?l=8&v=12&a=62&z=12&x=1383&y=2470
App::$app->get('/services/frontend/metrics/GetTileData', function (Request $request) {
	$controller = new services\TileDataService();
	$metricId = Params::GetInt('l');
	$metricVersionId = Params::GetInt('v');

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId)) return $denied;

	$levelId = Params::GetInt('a');
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	$frame = Frame::FromParams();
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	$b = Params::Get('b');
	return App::JsonImmutable($controller->GetTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z, $b));
});


// ej. http://mapas/services/metrics/GetBlockTileData?l=8&s=4&v=12&a=62&z=12&x=1383&y=2470
App::$app->get('/services/frontend/metrics/GetBlockTileData', function (Request $request) {
	$controller = new services\TileDataService();
	$metricId = Params::GetInt('l');
	$metricVersionId = Params::GetInt('v');
	if ($denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId)) return $denied;

	$levelId = Params::GetInt('a');
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	$frame = Frame::FromParams();
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$s = Params::GetIntMandatory('s');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	$b = Params::Get('b');
	if (!Context::Settings()->Map()->UseDataTileBlocks ||
			$s !== Context::Settings()->Map()->TileDataBlockSize)
			throw new ErrorException('Argumentos no válidos.');
	return App::JsonImmutable($controller->GetBlockTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z, $b));
});

// ej. http://mapas/services/clipping/GetBlockLabels?s=4&x=1382&y=2468&e=-34.569622,-58.257501%3B-34.667663,-58.608033&z=12&r=1692
App::$app->get('/services/frontend/clipping/GetBlockLabels', function (Request $request) {
	$controller = new services\LabelsService();
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$s = Params::GetIntMandatory('s');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	$b = Params::Get('b');
	if (!Context::Settings()->Map()->UseLabelTileBlocks ||
			$s !== Context::Settings()->Map()->LabelsBlockSize)
			throw new ErrorException('Argumentos no válidos.');
	return App::JsonImmutable($controller->GetBlockLabels($x, $y, $z, $b));
});

App::$app->get('/services/GetConfiguration', function (Request $request) {
	$controller = new services\ConfigurationService();
	return App::Json($controller->GetConfiguration());
});

App::$app->get('/services/metrics/GetFabMetrics', function (Request $request) {
	$controller = new services\MetricService();
	return App::JsonImmutable($controller->GetFabMetrics());
});

App::$app->get('/services/metrics/GetSelectedMetric', function (Request $request) {
	$controller = new services\SelectedMetricService();

	$metricId = Params::GetInt('l');
	// ej. /services/metrics/GetSelectedMetric?l=8

	return App::Json($controller->PublicGetSelectedMetric($metricId));
});

App::$app->get('/services/metrics/GetSelectedMetrics', function (Request $request) {
	$controller = new services\SelectedMetricService();

	// ej. /services/metrics/GetSelectedMetrics?l=8,9
	$metricsId = Params::Get('l');
	return App::Json($controller->PublicGetSelectedMetrics($metricsId));
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
	} else {
		$text = $e->getMessage();
		return new Response($text);
	}
	return new Response(App::RenderResolve($templates, array(
		'code' => $code,
		'title' => 'Error',
	)), $code);
});

