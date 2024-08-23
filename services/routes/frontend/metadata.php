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
	$metadataId = Params::GetIntMandatory('m');
	$fileId = Params::GetIntMandatory('f');

	if (!App::Settings()->Servers()->IsTransactionServerRequest()) {
		$controller = new commonServices\RemoteMetadataService();
		return $controller->GetMetadataFile($metadataId, $fileId);
	}

	$controller = new commonServices\MetadataService();
	$model = new MetadataModel();
	$workId = $model->GetWorkIdByMetadataId($metadataId);
	Session::$AccessLink = Params::Get('l');
	if ($workId !== null && $denied = Session::CheckIsWorkPublicOrAccessible($workId))
		return $denied;

	return $controller->GetMetadataFile($metadataId, $fileId);
});

// ej. http://mapas/services/metadata/GetMetadataPdf?m=12&f=4
App::$app->get('/services/metadata/GetMetadataPdf', function (Request $request) {
	$workId = Params::GetInt('w');
	$metadataId = Params::GetIntMandatory('m');
	if (!App::Settings()->Servers()->IsTransactionServerRequest())
	{
		$controller = new commonServices\RemoteMetadataService();
		return $controller->GetMetadataPdf($metadataId, $workId);
	}
	$controller = new commonServices\MetadataService();
	// x compatibilidad a links viejos
	if ($workId !== null && $denied = Session::CheckIsWorkPublicOrAccessible($workId))
		return $denied;

	return $controller->GetMetadataPdf($metadataId, null, false, $workId);
});

// ej. http://mapas/services/metadata/GetWorkMetadataPdf?w=12&f=4
App::$app->get('/services/metadata/GetWorkMetadataPdf', function (Request $request) {
	$metadataId = Params::GetInt('m');
	$workId = Params::GetIntMandatory('w');
	$datasetId = Params::GetInt('d', null);
	$link = Params::Get('l');

	if (!App::Settings()->Servers()->IsTransactionServerRequest()) {
		$controller = new commonServices\RemoteMetadataService();
		return $controller->GetWorkMetadataPdf($metadataId, $datasetId, $workId, $link);
	}

	$controller = new commonServices\MetadataService();
	if ($denied = Session::CheckIsWorkPublicOrAccessible($workId))
		return $denied;
	Session::$AccessLink = $link;
	return $controller->GetWorkMetadataPdf($metadataId, $datasetId, false, $workId);
});