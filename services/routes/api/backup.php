<?php

use Symfony\Component\HttpFoundation\Request;
use helena\services\api as services;

use helena\classes\App;
use minga\framework\Params;

// ej. http://mapas/services/api/startBackup?v=1&s=<key>
App::$app->get('/services/api/startBackup', function (Request $request) {

	$controller = new services\BackupService();
	$version = Params::GetIntMandatory('v');
	$controller->CheckVersion($version);
	$securityKey = Params::GetMandatory('s');
	$lastBackupDate = Params::Get('d');

	$ret = $controller->CreateJob($securityKey, $lastBackupDate);

	return App::Json($ret);
});


// ej. http://mapas/services/api/stepBackup
App::$app->get('/services/api/stepBackup', function (Request $request) {
	$controller = new services\BackupService();
	$sessionId = Params::GetMandatory('id');
	$securityKey = Params::GetMandatory('s');
	$flow = Params::GetInt('f');

	$ret = $controller->StepJob($securityKey, $sessionId, $flow == "1");

	return App::Json($ret);
});

// ej. http://mapas/services/api/stepFiles
App::$app->get('/services/api/stepFiles', function (Request $request) {
	$controller = new services\BackupService();
	$sessionId = Params::GetMandatory('id');
	$securityKey = Params::GetMandatory('s');
	$file = Params::GetIntMandatory('n');

	$ret = $controller->StepFiles($securityKey, $sessionId, $file);

	return App::Json($ret);
});