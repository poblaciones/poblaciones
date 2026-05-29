<?php

use Symfony\Component\HttpFoundation\Request;

use helena\entities\frontend\geometries\Frame;

use helena\services\frontend as services;

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;
use minga\framework\Performance;
use minga\framework\PublicException;
use helena\caches\MetricDataCache;

App::$app->get('/services/frontend/processor/GetMetricData', function (Request $request) {
	$controller = new services\TableService();
	$metricId = Params::GetIntMandatory('m');
	$levelId = Params::GetIntMandatory('l');
	$versionId = Params::GetIntMandatory('v');

	$result = $controller->GetMetricData($metricId, $versionId, $levelId);

	return App::Json($result);
});

App::$app->get('/services/frontend/processor/GetRegion', function (Request $request) {
	$controller = new services\TableService();
	$boundaryVersionId = Params::GetIntMandatory('id');
	$includedGeographyRelations = Params::GetIntArray('includedGeographyRelations');

	$result = $controller->GetRegion($boundaryVersionId, $includedGeographyRelations);

	return App::Json($result);
});


App::$app->get('/services/frontend/processor/GetRegionGeographyRelations', function (Request $request) {
	$controller = new services\TableService();
	$boundaryVersionId = Params::GetIntMandatory('id');
	$includedGeographyRelations = Params::GetIntArray('includedGeographyRelations');

	$result = $controller->GetRegionGeographyRelations($boundaryVersionId, $includedGeographyRelations);

	return App::Json($result);
});

