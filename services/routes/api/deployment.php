<?php

use helena\services\api as services;
use helena\classes\App;
use minga\framework\Params;

// ej. http://mapas/services/api/deploymentUpload
App::$app->post('/services/api/deploymentUpload', function() {
	$controller = new services\DeploymentService();
	$securityKey = Params::GetMandatory('s');
	$from = Params::GetInt('f');
	$length = Params::GetInt('l');
	$inverted = Params::Get('i');
	$ret = $controller->ReceiveFile($securityKey, $from, $length, $inverted == '1' );

	return App::Json($ret);
});

// ej. http://mapas/services/api/deploymentExpand
App::$app->get('/services/api/deploymentExpand', function() {
	$securityKey = Params::GetMandatory('s');
	$controller = new services\DeploymentService();
	$ret = $controller->Expand($securityKey);

	return App::Json($ret);
});

// ej. http://mapas/services/api/deploymentInstall
App::$app->get('/services/api/deploymentInstall', function() {
	$controller = new services\DeploymentService();
	$securityKey = Params::GetMandatory('s');
	$ret = $controller->Install($securityKey);

	return App::Json($ret);
});
