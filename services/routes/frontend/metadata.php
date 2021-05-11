<?php

use Symfony\Component\HttpFoundation\Request;
use helena\db\frontend\MetadataModel;

use helena\services\frontend as services;
use helena\services\common as commonServices;
$controller = new commonServices\MetadataService();

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;

// ej. http://mapas/services/metadata/GetMetadataFile?m=12&f=4
App::$app->get('/services/metadata/GetMetadataFile', function (Request $request) {
	$controller = new commonServices\MetadataService();
	$metadataId = Params::GetIntMandatory('m');
	$fileId = Params::GetIntMandatory('f');

	$model = new MetadataModel();
	$workId = $model->GetWorkIdByMetadataId($metadataId);
	Session::$AccessLink = Params::Get('l');
	if ($workId !== null && $denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return $controller->GetMetadataFile($metadataId, $fileId);
});

// ej. http://mapas/services/metadata/GetMetadataPdf?m=12&f=4
App::$app->get('/services/metadata/GetMetadataPdf', function (Request $request) {
	$controller = new commonServices\MetadataService();
	$metadataId = Params::GetIntMandatory('m');

	// x compatibilidad a links viejos
	$workId = Params::GetInt('w');
	if ($workId !== null && $denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	return $controller->GetMetadataPdf($metadataId, null, false, $workId);
});

