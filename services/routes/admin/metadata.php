<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\backoffice as services;
use helena\services\admin as adminServices;
use helena\services\common as commonServices;
use helena\entities\backoffice as entities;
use minga\framework\Params;

// ********************************* Servicios *********************************

// ******* Metadatos *********************************

App::GetOrPost('/services/admin/UpdateMetadata', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor()) return $denied;

	$controller = new services\MetadataService(false);
	$metadata = App::ReconnectJsonParam(entities\Metadata::class, 'm');
	return App::Json($controller->UpdateMetadata(null, $metadata));
});

App::GetOrPost('/services/admin/UpdateMetadataFile', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor()) return $denied;

	$bucketId = Params::GetMandatory('b');
	$metadataId = Params::GetIntMandatory('m');

	$controller = new services\MetadataFileService(false);
	$metadataFile = App::ReconnectJsonParam(entities\MetadataFile::class, 'f');

	$adminServices = new adminServices\MetadataService();
	$adminServices->EnsureId(entities\MetadataFile::class, $metadataFile);
	$file = $metadataFile->getFile();
	if ($file)
		$adminServices->EnsureId(entities\File::class, $file);

	return App::OrmJson($controller->UpdateMetadataFile(null, $metadataId, $bucketId, $metadataFile));
});


App::Get('/services/admin/DeleteMetadataFile', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor()) return $denied;

	$controller = new services\MetadataFileService(false);
	$metadataId = Params::GetIntMandatory('m');
	$metadataFileId = Params::GetIntMandatory('f');
	return App::Json($controller->DeleteMetadataFile(null, $metadataId, $metadataFileId));
});

App::$app->get('/services/admin/GetMetadataFile', function (Request $request) {
	$metadataId = Params::GetIntMandatory('m');
	$fileId = Params::GetIntMandatory('f');
	//if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\MetadataFileService(false);
	return $controller->GetMetadataFile($metadataId, $fileId);
});

App::Get('/services/admin/MoveSourceUp', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor()) return $denied;
	$controller = new services\SourceService(false);
	$metadataId = Params::GetIntMandatory('m');
	$sourceId = Params::GetIntMandatory('s');
	return App::Json($controller->MoveSourceUp(null, $metadataId, $sourceId));
});

App::Get('/services/admin/MoveSourceDown', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor()) return $denied;
	$controller = new services\SourceService(false);
	$metadataId = Params::GetIntMandatory('m');
	$sourceId = Params::GetIntMandatory('s');
	return App::Json($controller->MoveSourceDown(null, $metadataId, $sourceId));
});

App::Get('/services/admin/MoveMetadataFileUp', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor()) return $denied;
	$controller = new services\MetadataFileService(false);
	$metadataId = Params::GetIntMandatory('m');
	$metadataFileId = Params::GetIntMandatory('f');
	return App::Json($controller->MoveMetadataFileUp(null, $metadataId, $metadataFileId));
});

App::Get('/services/admin/MoveMetadataFileDown', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor()) return $denied;
	$controller = new services\MetadataFileService(false);
	$metadataId = Params::GetIntMandatory('m');
	$metadataFileId = Params::GetIntMandatory('f');
	return App::Json($controller->MoveMetadataFileDown(null, $metadataId, $metadataFileId));
});

App::$app->get('/services/admin/GetMetadataPdf', function (Request $request) {
	$controller = new commonServices\MetadataService(false);
	if ($denied = Session::CheckIsWorkReader(null)) return $denied;
	$metadataId = Params::GetIntMandatory('m');

	return $controller->GetMetadataPdf($metadataId, null, false);
});

App::$app->get('/services/admin/GetMetadataFile', function (Request $request) {
	$metadataId = Params::GetIntMandatory('m');
	$fileId = Params::GetIntMandatory('f');
	//if ($denied = Session::CheckIsSiteEditor()) return $denied;

	$controller = new services\MetadataFileService(false);
	return $controller->GetMetadataFile($metadataId, $fileId);
});


App::$app->get('/services/admin/AddWorkSource', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor()) return $denied;
	$controller = new services\SourceService(false);
	$metadataId = Params::GetIntMandatory('m');
	$sourceId = Params::GetIntMandatory('s');
	$ret = $controller->AddSourceToMetadata(null, $metadataId, $sourceId);
	return App::OrmJson($ret);
});

App::$app->get('/services/admin/RemoveSourceFromWork', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor()) return $denied;
	$controller = new services\SourceService(false);
	$metadataId = Params::GetIntMandatory('m');
	$sourceId = Params::GetInt('s');
	$ret = $controller->RemoveSourceFromWork(null, $metadataId, $sourceId);
	return App::Json($ret);
});

App::$app->get('/services/admin/GetAllPublicSources', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;
	$controller = new services\SourceService(false);
	return App::OrmJson($controller->GetAllPublicSources());
});

App::$app->get('/services/admin/GetAllPublicInstitutions', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;
	$controller = new services\InstitutionService(false);
	return App::OrmJson($controller->GetAllPublicInstitutions());
});

App::Get('/services/admin/MoveInstitutionUp', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;
	$controller = new services\InstitutionService(false);
	$metadataId = Params::GetIntMandatory('m');
	$institutionId = Params::GetIntMandatory('i');
	return App::Json($controller->MoveInstitutionUp(null, $metadataId, $institutionId));
});

App::Get('/services/admin/MoveInstitutionDown', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;
	$controller = new services\InstitutionService(false);
	$metadataId = Params::GetIntMandatory('m');
	$institutionId = Params::GetIntMandatory('i');
	return App::Json($controller->MoveInstitutionDown(null, $metadataId, $institutionId));
});

App::GetOrPost('/services/admin/UpdateWorkSource', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;

	$controller = new services\SourceService(false);
	$metadataId = Params::GetIntMandatory('m');

	$source = App::ReconnectJsonParam(entities\Source::class, 's');

	// Le asigna Ids antes de grabar
	$adminServices = new adminServices\MetadataService();
	$adminServices->EnsureId(entities\Source::class, $source);
	$adminServices->EnsureId(entities\Contact::class, $source->getContact());
	$institution = $source->getInstitution();
	if ($institution)
		$adminServices->EnsureId(entities\Institution::class, $institution);

	// Graba
	return App::OrmJson($controller->Update(null, $metadataId, $source));
});

App::GetOrPost('/services/admin/UpdateWorkInstitution', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;

	$controller = new services\InstitutionService(false);
	$metadataId = Params::GetIntMandatory('m');

	$institution = App::ReconnectJsonParam(entities\Institution::class, 'i');
	return App::OrmJson($controller->UpdateWorkInstitution(null, $metadataId, $institution));
});

App::GetOrPost('/services/admin/UpdateInstitution', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;

	$controller = new services\InstitutionService(false);
	$institution = App::ReconnectJsonParam(entities\Institution::class, 'i');
	// Traigo el base64 de la nueva imagen
	$watermarkImage = Params::Get('iwm');

	// Le asigna Ids antes de grabar
	$adminServices = new adminServices\MetadataService();
	$adminServices->EnsureId(entities\Institution::class, $institution);

	return App::OrmJson($controller->Update($institution, $watermarkImage));
});

App::$app->get('/services/admin/AddWorkInstitution', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;
	$controller = new services\InstitutionService(false);
	$metadataId = Params::GetIntMandatory('m');
	$institutionId = Params::GetIntMandatory('i');
	$ret = $controller->AddInstitutionToMetadata(null, $metadataId, $institutionId);
	return App::OrmJson($ret);
});

App::$app->get('/services/admin/RemoveInstitutionFromWork', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;
	$controller = new services\InstitutionService(false);
	$metadataId = Params::GetIntMandatory('m');
	$institutionId = Params::GetInt('i');
	$ret = $controller->RemoveInstitutionFromWork(null, $metadataId, $institutionId);
	return App::Json($ret);
});

App::$app->get('/services/admin/GetInstitutionWatermark', function (Request $request) {
	if ($denied = Session::CheckIsSiteEditor())
		return $denied;

	$watermarkId = Params::GetIntMandatory('iwmid');
	$controller = new services\InstitutionService(false);
	return $controller->GetInstitutionWatermark($watermarkId);
});