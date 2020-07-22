<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\backoffice as services;
use helena\services\admin as adminServices;
use helena\entities\backoffice as entities;
use minga\framework\Params;
use minga\framework\ErrorException;
use helena\db\frontend\SnapshotMetricModel;

// ********************************* Servicios *********************************

// ******* Work *********************************

App::$app->get('/services/backoffice/CreateWork', function (Request $request) {
	$controller = new services\WorkService();
	$title = Params::GetMandatory('c');
	$type = Params::GetMandatory('t');
	if ($type !== 'P' && $type !== 'R')
			throw new ErrorException('Invalid type.');

	$entity = $controller->Create($type, $title);
	return App::OrmJson($entity);
});


App::$app->get('/services/backoffice/GetFactories', function (Request $request) {
	$ret = array();
	$sourceService = new services\SourceService();
	$ret['Source'] = $sourceService->GetNewSource();
	$institutionService = new services\InstitutionService();
	$ret['Institution'] = $institutionService->GetNewInstitution();
	$metadataFileService = new services\MetadataFileService();
	$ret['MetadataFile'] = $metadataFileService->GetNewMetadataFile(null);

	$userService = new adminServices\UserService();
	$ret['User'] = $userService->GetNewUser();

	$metricService = new services\MetricService();
	$ret['MetricVersionLevel'] = $metricService->GetNewMetricVersionLevel();

	$ret['Variable'] = $metricService->GetNewVariable();

	return App::OrmJson($ret);
});


App::GetOrPost('/services/backoffice/GetWorkMetricsList', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$controller = new services\WorkService();
	return App::OrmJson($controller->GetWorkMetricsList($workId));
});


App::GetOrPost('/services/backoffice/UpdateWorkSource', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\SourceService();
	$source = App::ReconnectJsonParam(entities\DraftSource::class, 's');
	return App::OrmJson($controller->Update($workId, $source));
});

App::GetOrPost('/services/backoffice/UpdateInstitution', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\InstitutionService();
	$institution = App::ReconnectJsonParam(entities\DraftInstitution::class, 'i');
	// Traigo el base64 de la nueva imagen
	$watermarkImage = Params::Get('iwm');

	return App::OrmJson($controller->Update($institution, $watermarkImage));
});

App::$app->get('/services/backoffice/GetCurrentUserWorks', function (Request $request) {
	$controller = new services\WorkService();
	return App::Json($controller->GetCurrentUserWorks());
});

App::$app->get('/services/backoffice/GetInstitutionWatermark', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;
	$watermarkId = Params::GetIntMandatory('iwmid');
	$controller = new services\InstitutionService();
	return $controller->GetInstitutionWatermark($watermarkId);
});

App::$app->get('/services/backoffice/GetWorkInfo', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$controller = new services\WorkService();
	return App::OrmJson($controller->GetWorkInfo($workId));
});

App::$app->get('/services/backoffice/AppendExtraMetric', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$metricId = Params::GetIntMandatory('m');
	$check = new SnapshotMetricModel();
	if (!$check->HasVisibleVersions($metricId))
		return Session::NotEnoughPermissions();

	$controller = new services\WorkService();
	return App::Json($controller->AppendExtraMetric($workId, $metricId));
});

App::$app->get('/services/backoffice/UpdateExtraMetricStart', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$metricId = Params::GetIntMandatory('m');
	$check = new SnapshotMetricModel();
	if (!$check->HasVisibleVersions($metricId))
		return Session::NotEnoughPermissions();
	$active = Params::GetBoolMandatory('a');

	$controller = new services\WorkService();
	return App::Json($controller->UpdateExtraMetricStart($workId, $metricId, $active));
});

App::$app->get('/services/backoffice/RemoveExtraMetric', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$metricId = Params::GetIntMandatory('m');
	$controller = new services\WorkService();
	return App::Json($controller->RemoveExtraMetric($workId, $metricId));
});

App::$app->post('/services/backoffice/UpdateStartup', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$work = App::Orm()->find(entities\DraftWork::class, $workId);
	$startup = App::ReconnectJsonParamMandatory(entities\DraftWorkStartup::class, 's');
	if ($work->getStartup()->getId() !== $startup->getId())
	{
		throw new ErrorException('Invalid startup.');
	}
	$controller = new services\WorkService();
	return App::Json($controller->UpdateStartup($workId, $startup));
});

App::$app->get('/services/backoffice/UpdateWorkVisibility', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$private = Params::GetBoolMandatory('p');
	$link = Params::Get('l');
	$controller = new services\WorkService();
	return App::Json($controller->UpdateWorkVisibility($workId, $private, $link));
});

App::$app->get('/services/backoffice/RequestReview', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\WorkService();
	return App::Json($controller->RequestReview($workId));
});

App::$app->get('/services/backoffice/StartPublishWork', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\PublishService();
	return App::Json($controller->StartPublication($workId));
});

App::$app->get('/services/backoffice/StepPublishWork', function (Request $request) {
	$controller = new services\PublishService();
	$key = Params::GetMandatory('k');
	return App::Json($controller->StepPublication($key));
});

App::$app->get('/services/backoffice/StartRevokeWork', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\RevokeService();
	return App::Json($controller->StartRevoke($workId));
});

App::$app->get('/services/backoffice/StepRevokeWork', function (Request $request) {
	$controller = new services\RevokeService();
	$key = Params::GetMandatory('k');
	return App::Json($controller->StepRevoke($key));
});


// ej. http://mapas/services/backoffice/StartCloneWork?w=5
App::$app->get('/services/backoffice/StartCloneWork', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$controller = new services\WorkCloneService();
	$name = Params::Get('n');
	return App::Json($controller->StartCloneWork($workId, $name));
});

App::$app->get('/services/backoffice/StepCloneWork', function (Request $request) {
	$controller = new services\WorkCloneService();
	$key = Params::GetMandatory('k');
	return App::Json($controller->StepCloneWork($key));
});

// ej. http://mapas/services/backoffice/StartTestWork?w=5
App::$app->get('/services/backoffice/StartTestWork', function (Request $request) {
	$controller = new services\WorkTestService();
	$name = Params::Get('n');
	$workId = Params::GetIntMandatory('w');
	return App::Json($controller->StartTestWork($workId, $name));
});

App::$app->get('/services/backoffice/StepTestWork', function (Request $request) {
	$controller = new services\WorkTestService();
	$key = Params::GetMandatory('k');
	return App::Json($controller->StepTestWork($key));
});

// ej. http://mapas/services/backoffice/StartDeleteWork?w=5
App::$app->get('/services/backoffice/StartDeleteWork', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	//if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\WorkDeleteService();
	return App::Json($controller->StartDeleteWork($workId));
});

App::$app->get('/services/backoffice/StepDeleteWork', function (Request $request) {
	$controller = new services\WorkDeleteService();
	$key = Params::GetMandatory('k');
	return App::Json($controller->StepDeleteWork($key));
});

