<?php

use Symfony\Component\HttpFoundation\Request;
use helena\db\frontend\MetadataModel;

use helena\services\frontend as services;
use helena\services\common as commonServices;

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;


// ej. http://mapas/map/3701/metadata
App::$app->get('/map/metadata', function (Request $request) {
	$controller = new commonServices\MetadataService();
	$workId = Params::CheckParseIntValue(Params::CheckMandatoryValue(Params::FromPath(2)));
	Session::$AccessLink = Params::Get('l');

	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId)) return $denied;

	$workService = new services\WorkService();
	$work = $workService->GetWorkOnly($workId);
	$metadataId = $work->Metadata->Id;

	return $controller->GetMetadataPdf($metadataId, null, false, $workId);
});
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
	$metadataId = Params::GetInt('m');

	return $controller->GetMetadataPdf($metadataId, null, false, null);
});

