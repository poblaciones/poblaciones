<?php

use Symfony\Component\HttpFoundation\Request;

use helena\entities\frontend\geometries\Coordinate;

use helena\services\frontend as services;

use helena\classes\App;
use helena\classes\Statistics;
use minga\framework\Params;
use helena\classes\Session;
use minga\framework\Context;
use minga\framework\PublicException;

App::$app->get('/services/GetTransactionServer', function (Request $request) {
	$controller = new services\ConfigurationService();
	return App::Json($controller->GetTransactionServer());
});

