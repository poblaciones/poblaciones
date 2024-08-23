<?php

use Symfony\Component\HttpFoundation\Request;

use helena\controllers\frontend as controllers;
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
App::RegisterControllerGet('/map/{any}', controllers\cMap::class)->assert("any", ".*");
App::RegisterControllerGet('/datasets', controllers\cDatasets::class);

App::RegisterControllerGet('/services/content/downloads', controllers\cDownloads::class);

require_once('frontend/map.php');
require_once('frontend/metadata.php');

if (App::Settings()->Servers()->IsTransactionServerRequest()) {
	require_once('frontend/boundary.php');
	require_once('frontend/clipping.php');
	require_once('frontend/session.php');
	require_once('frontend/crawler.php');
	require_once('frontend/metric.php');
	require_once('frontend/work.php');

	require_once('frontend/authentication.php');
}
App::$app->get('/robots.txt', function(Request $request) {
	return 'User-agent: *
					Disallow: /';
});


