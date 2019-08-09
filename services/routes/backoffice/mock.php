<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Mock;
use helena\services\backoffice as services;

// ********************************* Servicios *********************************
// ******* Mock *********************************
App::$app->get('/mock/{a1}/{a2}/{a3}', function (Request $request) {
	return Mock::LoadRequest();
});
App::$app->get('/mock/{a1}/{a2}', function (Request $request) {
	return Mock::LoadRequest();
});
App::$app->get('/mock/{a1}', function (Request $request) {
	return Mock::LoadRequest();
});

App::$app->get('/services/backoffice/mock/list', function (Request $request) {
	$controller = new services\MockService();
	return App::Json($controller->GetList());
});
