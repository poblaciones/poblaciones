<?php

use Symfony\Component\HttpFoundation\Request;

use helena\entities\frontend\geometries\Coordinate;

use helena\services\frontend as services;

use helena\classes\App;
use helena\classes\Statistics;
use minga\framework\Params;
use minga\framework\Context;
use minga\framework\PublicException;

App::$app->get('/services/frontend/Search', function (Request $request) {
	$query = Params::Get('q');
	$controller = new services\LookupService();
	$filter = Params::Get('f', '');

	return App::JsonImmutable($controller->Search($query, $filter, false));
});


App::$app->get('/services/clipping/GetDefaultFrame', function (Request $request) {
	$controller = new services\ClippingService();
	$paramCoordinate = Params::Get('p');
	$coordinate = Coordinate::TextDeserialize($paramCoordinate);
	return App::Json($controller->GetDefaultFrame($coordinate));
});

App::$app->get('/services/metrics/GetLabelInfo', function (Request $request) {
	$controller = new services\InfoWindowService();

	// f: es featureId (datasetId << 32 || id)
	$featureId = Params::GetMandatory('f');

	return App::Json($controller->GetLabelInfo($featureId));
});

// ej. http://mapas/services/clipping/GetLabels?x=1382&y=2468&e=-34.569622,-58.257501%3B-34.667663,-58.608033&z=12&r=1692
App::$app->get('/services/frontend/clipping/GetLabels', function (Request $request) {
	$controller = new services\LabelsService();
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	return App::JsonImmutable($controller->GetLabels($x, $y, $z));
});

// ej. http://mapas/services/geographies/GetGeography?a=62&z=12&x=1380&y=2468
App::$app->get('/services/frontend/geographies/GetGeography', function (Request $request) {
	$controller = new services\GeographyService();
	$levelId = Params::GetIntMandatory('a');
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	$p = Params::GetInt('p', 0);
	$ret = $controller->GetGeography($levelId, $x, $y, $z, $p);

	return App::JsonImmutable($ret);
});

// ej. http://mapas/services/clipping/GetBlockLabels?s=4&x=1382&y=2468&e=-34.569622,-58.257501%3B-34.667663,-58.608033&z=12&r=1692
App::$app->get('/services/frontend/clipping/GetBlockLabels', function (Request $request) {
	$controller = new services\LabelsService();
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$s = Params::GetIntMandatory('s');
	$z = Params::GetIntRangeMandatory('z', 0, 23);
	if (!App::Settings()->Map()->UseLabelTileBlocks ||
			$s !== App::Settings()->Map()->LabelsBlockSize)
			throw new PublicException('El tamaño de bloque de etiquetas solicitado no coincide con la configuración del servidor. Cargue nuevamente el mapa para continuar trabajando.');
	return App::JsonImmutable($controller->GetBlockLabels($x, $y, $z));
});

App::$app->get('/services/GetConfiguration', function (Request $request) {
	$controller = new services\ConfigurationService();
	$topUrl = Params::Get('t');
	if ($topUrl)
	{
		$clientUrl = Params::Get('c');
		Statistics::SaveEmbeddedHit($topUrl, $clientUrl);
	}
	return App::Json($controller->GetConfiguration());
});

App::$app->get('/services/metrics/GetFabMetrics', function (Request $request) {
	$controller = new services\FabService();
	return App::JsonImmutable($controller->GetFabMetrics());
});

App::$app->get('/services/metrics/GetSelectedInfos', function (Request $request) {
	$controller = new services\SelectedMetricService();

	// ej. /services/metrics/GetSelectedMetrics?l=8,9
	$metricsId = Params::Get('l');
	return App::Json($controller->PublicGetSelectedInfos($metricsId));
});

