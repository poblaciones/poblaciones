<?php

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

use helena\entities\frontend\geometries\Frame;
use helena\entities\frontend\geometries\Coordinate;
use helena\entities\frontend\geometries\Circle;
use helena\db\frontend\MetadataModel;

use helena\services\frontend as services;
use helena\controllers\frontend as controllers;
use helena\services\common as commonServices;
use helena\services\backoffice\InstitutionService;

use helena\classes\GlobalTimer;
use helena\classes\App;
use helena\classes\Links;

App::$app->get('/', function (Request $request) {
	return App::RedirectKeepingParams(Links::GetMapUrl());
});

App::$app->post('/', function (Request $request) {
	return App::NotFoundResponse();
});


// MAPA
App::RegisterControllerGet('/map', controllers\cMap::class);
App::RegisterControllerGet('/map/', controllers\cMap::class);
App::RegisterControllerGet('/services/content/downloads', controllers\cDownloads::class);
App::RegisterControllerGet('/map/{any}', controllers\cMap::class)->assert("any", ".*");

App::RegisterControllerGet('/datasets', controllers\cDatasets::class);

require_once('frontend/boundary.php');
require_once('frontend/clipping.php');
require_once('frontend/crawler.php');
require_once('frontend/map.php');
require_once('frontend/metadata.php');
require_once('frontend/metric.php');
require_once('frontend/work.php');

App::$app->get('/robots.txt', function(Request $request) {
	return 'User-agent: *
					Disallow: /';
});


