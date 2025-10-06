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

	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;

	$controller = new services\MetadataService();
	$metadata = App::ReconnectJsonParam(entities\DraftMetadata::class, 'm');
	return App::Json($controller->UpdateMetadata($workId, $metadata));
});

App::GetOrPost('/services/backoffice/UpdateMetadataFile', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;

	$bucketId = Params::GetMandatory('b');
	$metadataId = Params::GetIntMandatory('m');

	$controller = new services\MetadataFileService();
	$metadataFile = App::ReconnectJsonParam(entities\DraftMetadataFile::class, 'f');
	return App::OrmJson($controller->UpdateMetadataFile($workId, $metadataId, $bucketId, $metadataFile));
});


App::Get('/services/backoffice/DeleteMetadataFile', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;

	$controller = new services\MetadataFileService();
	$metadataId = Params::GetIntMandatory('m');
	$metadataFileId = Params::GetIntMandatory('f');
	return App::Json($controller->DeleteMetadataFile($workId, $metadataId, $metadataFileId));
});


App::Get('/services/backoffice/MoveSourceUp', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\SourceService();
	$metadataId = Params::GetIntMandatory('m');
	$sourceId = Params::GetIntMandatory('s');
	return App::Json($controller->MoveSourceUp($workId, $metadataId, $sourceId));
});

App::Get('/services/backoffice/MoveSourceDown', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\SourceService();
	$metadataId = Params::GetIntMandatory('m');
	$sourceId = Params::GetIntMandatory('s');
	return App::Json($controller->MoveSourceDown($workId, $metadataId, $sourceId));
});

App::Get('/services/backoffice/MoveMetadataFileUp', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\MetadataFileService();
	$metadataId = Params::GetIntMandatory('m');
	$metadataFileId = Params::GetIntMandatory('f');
	return App::Json($controller->MoveMetadataFileUp($workId, $metadataId, $metadataFileId));
});

App::Get('/services/backoffice/MoveMetadataFileDown', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\MetadataFileService();
	$metadataId = Params::GetIntMandatory('m');
	$metadataFileId = Params::GetIntMandatory('f');
	return App::Json($controller->MoveMetadataFileDown($workId, $metadataId, $metadataFileId));
});

App::$app->get('/services/backoffice/GetMetadataPdf', function (Request $request) {
	$controller = new commonServices\MetadataService();
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId))
		return $denied;
	$work = App::Orm()->find(entities\DraftWork::class, $workId);
	$metadataId = $work->getMetadata()->getId();
	return $controller->GetMetadataPdf($metadataId, null, true, $work->getId());
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
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\SourceService();
	$metadataId = Params::GetIntMandatory('m');
	$sourceId = Params::GetIntMandatory('s');
	$ret = $controller->AddSourceToMetadata($workId, $metadataId, $sourceId);
	return App::OrmJson($ret);
});

App::$app->get('/services/backoffice/RemoveSourceFromWork', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\SourceService();
	$metadataId = Params::GetIntMandatory('m');
	$sourceId = Params::GetInt('s');
	$ret = $controller->RemoveSourceFromWork($workId, $metadataId, $sourceId);
	return App::Json($ret);
});

App::$app->get('/services/backoffice/GetAllSourcesByCurrentUser', function (Request $request) {
	$controller = new services\SourceService();
	return App::OrmJson($controller->GetAllSourcesByCurrentUser());
});

App::$app->get('/services/backoffice/GetAllInstitutionsByCurrentUser', function (Request $request) {
	$controller = new services\InstitutionService();
	return App::OrmJson($controller->GetAllInstitutionsByCurrentUser());
});

App::Get('/services/backoffice/MoveInstitutionUp', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\InstitutionService();
	$metadataId = Params::GetIntMandatory('m');
	$institutionId = Params::GetIntMandatory('i');
	return App::Json($controller->MoveInstitutionUp($workId, $metadataId, $institutionId));
});

App::Get('/services/backoffice/MoveInstitutionDown', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\InstitutionService();
	$metadataId = Params::GetIntMandatory('m');
	$institutionId = Params::GetIntMandatory('i');
	return App::Json($controller->MoveInstitutionDown($workId, $metadataId, $institutionId));
});

App::GetOrPost('/services/backoffice/UpdateWorkSource', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;

	$controller = new services\SourceService();
	$metadataId = Params::GetIntMandatory('m');

	$source = App::ReconnectJsonParam(entities\DraftSource::class, 's');
	return App::OrmJson($controller->Update($workId, $metadataId, $source));
});

App::GetOrPost('/services/backoffice/UpdateWorkInstitution', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;

	$controller = new services\InstitutionService();
	$metadataId = Params::GetIntMandatory('m');

	$institution = App::ReconnectJsonParam(entities\DraftInstitution::class, 'i');
	return App::OrmJson($controller->UpdateWorkInstitution($workId, $metadataId, $institution));
});

App::GetOrPost('/services/backoffice/UpdateInstitution', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;

	$controller = new services\InstitutionService();
	$metadataId = Params::GetIntMandatory('m');
	$institution = App::ReconnectJsonParam(entities\DraftInstitution::class, 'i');
	// Traigo el base64 de la nueva imagen
	$watermarkImage = Params::Get('iwm');

	return App::OrmJson($controller->Update($institution, $watermarkImage));
});

App::$app->get('/services/backoffice/AddWorkInstitution', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\InstitutionService();
	$metadataId = Params::GetIntMandatory('m');
	$institutionId = Params::GetIntMandatory('i');
	$ret = $controller->AddInstitutionToMetadata($workId, $metadataId, $institutionId);
	return App::OrmJson($ret);
});

App::$app->get('/services/backoffice/RemoveInstitutionFromWork', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;
	$controller = new services\InstitutionService();
	$metadataId = Params::GetIntMandatory('m');
	$institutionId = Params::GetInt('i');
	$ret = $controller->RemoveInstitutionFromWork($workId, $metadataId, $institutionId);
	return App::Json($ret);
});