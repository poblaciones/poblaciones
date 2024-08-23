<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\backoffice as services;
use minga\framework\Params;
use minga\framework\PublicException;

// Backoffice

App::$app->get('/services/backoffice/GetTransactionServer', function (Request $request) {
	$configuration = new services\ConfigurationService();
	return App::Json($configuration->GetTransactionServer());
});

