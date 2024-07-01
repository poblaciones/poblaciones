<?php

use helena\services\api as services;
use helena\classes\App;
use minga\framework\Params;

// ej. http://mapas/services/api/updateUpload
App::$app->post('/services/api/updateUpload', function() {
	$controller = new services\UpdateService();
	$ret = $controller->ReceiveFile();

	return App::Json($ret);
});

// ej. http://mapas/services/api/updateUnzip
App::$app->get('/services/api/updateUnzip', function() {
	$controller = new services\UpdateService();
	$ret = $controller->Unzip();

	return App::Json($ret);
});

// ej. http://mapas/services/api/updateInstall
App::$app->get('/services/api/updateInstall', function() {
	$controller = new services\UpdateService();
	$ret = $controller->Install();

	return App::Json($ret);
});
