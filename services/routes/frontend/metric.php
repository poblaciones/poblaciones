<?php

use Symfony\Component\HttpFoundation\Request;

use helena\entities\frontend\geometries\Frame;

use helena\services\frontend as services;

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;
use minga\framework\Performance;
use minga\framework\PublicException;
use helena\caches\LayerDataCache;

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
	$hiddenValueLabels = Params::GetIntArray('h');


	if ($denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId)) return $denied;

	return App::JsonImmutable($controller->GetRanking($frame, $metricId, $metricVersionId, $levelId, $variableId, $hasTotals, $urbanity, $size, $direction, $hiddenValueLabels));
});

App::$app->get('/services/metrics/GetMetricNavigationInfo', function (Request $request) {
	$controller = new services\InfoWindowService();

	$metricId = Params::GetIntMandatory('l');
	$variableId = Params::GetIntMandatory('i');
	$unselectedIds = Params::GetIntArray('h');

	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	$frame = Frame::FromParams();

	return App::JsonImmutable($controller->GetMetricNavigationInfo($metricId, $variableId, $frame, $urbanity, $unselectedIds));
});

App::$app->get('/services/metrics/GetMetricItemInfo', function (Request $request) {
	$controller = new services\InfoWindowService();

	$metricId = Params::GetIntMandatory('m');
	$variableId = Params::GetIntMandatory('v');

	// f: puede ser un geographyId o un featureId (datasetId << 32 || id)
	$featureId = Params::GetMandatory('f');

	return App::Json($controller->GetMetricItemInfo($featureId, $metricId, $variableId));
});


App::$app->get('/services/frontend/metrics/GetLayerData', function (Request $request) {
	$metricId = Params::GetInt('l');
	$metricVersionId = Params::GetInt('v');

	if ($denied = Session::CheckIsWorkPublicOrAccessibleByMetricVersion($metricId, $metricVersionId)) return $denied;

	$frame = Frame::FromParams();
	$levelId = Params::GetInt('a');
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));

	$key = LayerDataCache::CreateKey($frame, $metricVersionId, $levelId, $urbanity);

	return App::JsonCacheableImmutable(
				LayerDataCache::Cache(),
				[$metricId, $key],
				function() use ($frame, $metricId, $metricVersionId, $levelId, $urbanity) {
					$controller = new services\TileDataService();
					return $controller->GetLayerData($frame, $metricId, $metricVersionId, $levelId, $urbanity);
				},
				($frame->ClippingCircle != null) // skipCache
		);
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
	return App::JsonImmutable($controller->GetTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z));
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
	if (!App::Settings()->Map()->UseDataTileBlocks ||
			$s !== App::Settings()->Map()->TileDataBlockSize)
		throw new PublicException('El tamaño de bloque de datos solicitado no coincide con la configuración del servidor. Cargue nuevamente el mapa para continuar trabajando.');
	return App::JsonImmutable($controller->GetBlockTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z));
});

App::$app->get('/services/metrics/GetSelectedMetric', function (Request $request) {
	$controller = new services\SelectedMetricService();

	$metricId = Params::GetInt('l');
	// ej. /services/metrics/GetSelectedMetric?l=8

	return App::Json($controller->PublicGetSelectedMetric($metricId));
});

App::$app->get('/services/metrics/GetSelectedMetricByFID', function (Request $request) {
	$fid = Params::GetInt('f');

	$info = new services\InfoWindowService();
	$metricId = $info->GetLabelInfoDefaultMetric($fid);

	// ej. /services/metrics/GetSelectedMetric?l=8
	$controller = new services\SelectedMetricService();
	return App::Json($controller->PublicGetSelectedMetric($metricId));
});

