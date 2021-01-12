<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\backoffice as services;
use helena\services\common as commonServices;
use helena\entities\backoffice as entities;
use minga\framework\Params;

// ********************************* Servicios *********************************

// ******* Metadatos *********************************

App::GetOrPost('/services/backoffice/UpdateMetadata', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\MetadataService();
	$metadata = App::ReconnectJsonParam(entities\DraftMetadata::class, 'm');
	return App::Json($controller->UpdateMetadata($workId, $metadata));
});

App::GetOrPost('/services/backoffice/UpdateMetadataFile', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$bucketId = Params::GetMandatory('b');

	$controller = new services\MetadataFileService();
	$metadataFile = App::ReconnectJsonParam(entities\DraftMetadataFile::class, 'f');
	return App::OrmJson($controller->UpdateMetadataFile($workId, $bucketId, $metadataFile));
});


App::Get('/services/backoffice/DeleteMetadataFile', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$controller = new services\MetadataFileService();
	$metadataFileId = Params::GetIntMandatory('f');
	return App::Json($controller->DeleteMetadataFile($workId, $metadataFileId));
});


App::Get('/services/backoffice/MoveSourceUp', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$controller = new services\SourceService();
	$sourceId = Params::GetIntMandatory('s');
	return App::Json($controller->MoveSourceUp($workId, $sourceId));
});

App::Get('/services/backoffice/MoveSourceDown', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$controller = new services\SourceService();
	$sourceId = Params::GetIntMandatory('s');
	return App::Json($controller->MoveSourceDown($workId, $sourceId));
});

App::Get('/services/backoffice/MoveMetadataFileUp', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$controller = new services\MetadataFileService();
	$metadataFileId = Params::GetIntMandatory('f');
	return App::Json($controller->MoveMetadataFileUp($workId, $metadataFileId));
});

App::Get('/services/backoffice/MoveMetadataFileDown', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$controller = new services\MetadataFileService();
	$metadataFileId = Params::GetIntMandatory('f');
	return App::Json($controller->MoveMetadataFileDown($workId, $metadataFileId));
});

App::$app->get('/services/backoffice/GetMetadataPdf', function (Request $request) {
	$controller = new commonServices\MetadataService();
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$work = App::Orm()->find(entities\DraftWork::class, $workId);
	return $controller->GetMetadataPdf($work->getMetadata()->getId(), null, true, $work->getId());
});


App::$app->get('/services/backoffice/GetMetadataFile', function (Request $request) {
	$metadataId = Params::GetIntMandatory('m');
	$fileId = Params::GetIntMandatory('f');
	//if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\MetadataFileService();
	return $controller->GetMetadataFile($metadataId, $fileId);
});


App::$app->get('/services/backoffice/AddWorkSource', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$controller = new services\SourceService();
	$sourceId = Params::GetIntMandatory('s');
	$ret = $controller->AddSourceToWork($workId, $sourceId);
	return App::OrmJson($ret);
});

App::$app->get('/services/backoffice/RemoveSourceFromWork', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$controller = new services\SourceService();
	$sourceId = Params::GetInt('s');
	$ret = $controller->RemoveSourceFromWork($workId, $sourceId);
	return App::Json($ret);
});

App::$app->get('/services/backoffice/GetAllInstitutions', function (Request $request) {
	$controller = new services\InstitutionService();
	return App::OrmJson($controller->GetAllInstitutions());
});

App::$app->get('/services/backoffice/GetAllInstitutionsByCurrentUser', function (Request $request) {
	$controller = new services\InstitutionService();
	return App::OrmJson($controller->GetAllInstitutionsByCurrentUser());
});

App::$app->get('/services/backoffice/GetAllSources', function (Request $request) {
	$controller = new services\SourceService();
	return App::OrmJson($controller->GetAllSources());
});

App::$app->get('/services/backoffice/GetAllSourcesByCurrentUser', function (Request $request) {
	$controller = new services\SourceService();
	return App::OrmJson($controller->GetAllSourcesByCurrentUser());
});

App::$app->get('/services/backoffice/GetAllAttachments', function (Request $request) {
	$controller = new services\AttachmentService();
	return App::OrmJson($controller->GetAllAttachments());
});
