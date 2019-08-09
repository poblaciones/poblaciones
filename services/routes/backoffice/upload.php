<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\backoffice as services;
use minga\framework\Params;


// ********************************* Servicios *********************************

App::GetOrPost('/services/backoffice/UploadChunk', function (Request $request) {
	$controller = new services\UploadService();
	$bucketId = Params::GetMandatory('b');
	return App::Json($controller->FileChunkUpload($bucketId));
});

App::$app->post('/services/backoffice/UploadFile', function (Request $request) {
	$controller = new services\UploadService();
	return App::Json($controller->FileUpload());
});

App::GetOrPost('/services/backoffice/Dataset/CreateMultiUploadFile', function (Request $request) {
	$controller = new services\UploadService();
	$datasetId = Params::GetIntMandatory('d');
	$bucketId = Params::GetMandatory('b');
	$fileExtension = Params::GetMandatory('fe');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$keepLabels = Params::GetIntMandatory('k') === 1;
	return App::Json($controller->CreateMultiUploadFile($datasetId, $bucketId, $fileExtension, $keepLabels));
});

App::$app->get('/services/backoffice/Dataset/StepMultiUploadFile', function (Request $request) {
	//$content = file_get_contents("C:\\Users\\Gonzo\\Downloads\\mapasocial2\\website\\services\\storage\\temp\\521C.tmp\\header.json");
	//return App::Json(json_decode($content)->varNames);
	$controller = new services\UploadService();
	$key = Params::Get('k');
	// testing
	//$key = "BBC8.tmp";
	return App::Json($controller->StepMultiUploadFile($key));
});

