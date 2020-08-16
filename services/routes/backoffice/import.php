<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\backoffice as services;
use minga\framework\Params;


// ********************************* Servicios *********************************
App::$app->post('/services/backoffice/SingleStepFileImport', function (Request $request) {
	$controller = new services\ImportService();
	return App::Json($controller->SingleStepFileImport());
});

App::GetOrPost('/services/backoffice/PostImportChunk', function (Request $request) {
	$controller = new services\ImportService();
	$bucketId = Params::GetMandatory('b');
	return App::Json($controller->FileChunkImport($bucketId));
});

App::GetOrPost('/services/backoffice/Dataset/CreateMultiImportFile', function (Request $request) {
	$controller = new services\ImportService();
	$datasetId = Params::GetIntMandatory('d');
	$bucketId = Params::GetMandatory('b');
	$fileExtension = Params::GetMandatory('fe');
	$selectedSheetIndex = Params::GetInt('s');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$keepLabels = Params::GetIntMandatory('k') === 1;
	return App::Json($controller->CreateMultiImportFile($datasetId, $bucketId, $fileExtension, $keepLabels, $selectedSheetIndex));
});

App::GetOrPost('/services/backoffice/Dataset/VerifyDatasetsImportFile', function (Request $request) {
	$controller = new services\ImportService();
	$bucketId = Params::GetMandatory('b');
	$fileExtension = Params::GetMandatory('fe');
	return App::Json($controller->VerifyDatasetsImportFile($bucketId, $fileExtension));
});

App::$app->get('/services/backoffice/Dataset/StepMultiImportFile', function (Request $request) {
	$controller = new services\ImportService();
	$key = Params::Get('k');
	// testing
	//$key = "BBC8.tmp";
	return App::Json($controller->StepMultiImportFile($key));
});

