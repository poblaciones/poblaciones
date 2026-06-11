<?php

/**
 * Endpoints de automatización para operaciones a nivel Work (cartografía).
 *
 * Autenticación: todas las rutas requieren el header X-Api-Key o el parámetro api_key.
 *
 * Operaciones de un solo paso:
 *   POST /api/automation/CreateWork
 *   GET  /api/automation/GetWork
 *   GET  /api/automation/GetWorks
 *   GET  /api/automation/GetSiteWorks
 *   POST /api/automation/UpdateMetadata
 *   POST /api/automation/UpdateWorkVisibility
 *   GET  /api/automation/DownloadWorkDatasets
 *
 * Operaciones multi-paso (el cliente hace polling sobre el Step correspondiente):
 *   GET /api/automation/StartPublishWork  → GET /api/automation/StepPublishWork?k=...
 *   GET /api/automation/StartRevokeWork   → GET /api/automation/StepRevokeWork?k=...
 *   GET /api/automation/StartDeleteWork   → GET /api/automation/StepDeleteWork?k=...
 *   GET /api/automation/StartCloneWork    → GET /api/automation/StepCloneWork?k=...
 */

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\classes\AutomationAuth;
use helena\services\backoffice as services;
use helena\services\admin as adminServices;
use helena\services\api as apiServices;
use helena\entities\backoffice as entities;
use minga\framework\Params;
use minga\framework\PublicException;

// ******* Work ***************************************************************

/**
 * Crea una cartografía nueva y retorna su ID.
 *
 * Parámetros POST:
 *   title  (string, obligatorio) – título
 *   type   (string, opcional)    – 'R' cartografía (default) | 'P' datos públicos
 *
 * Respuesta: objeto Work serializado (incluye Id).
 */
App::$app->post('/services/api/automation/CreateWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$title = Params::GetMandatory('title');
	$type  = Params::Get('type', 'R');
	if ($type !== 'R' && $type !== 'P') {
		throw new PublicException("Tipo inválido: debe ser 'R' (cartografía) o 'P' (datos públicos).");
	}

	$controller = new services\WorkService();
	$entity = $controller->Create($type, $title);
	return App::OrmJson($entity);
});

/**
 * Retorna la información completa de una cartografía.
 *
 * Parámetros GET:
 *   w (int, obligatorio) – work ID
 */
App::$app->get('/services/api/automation/GetWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$controller = new services\WorkService();
	return App::OrmJson($controller->GetWorkInfo($workId));
});

/**
 * Lista las cartografías del usuario autenticado.
 *
 * Respuesta: array de objetos Work (resumen, sin datasets ni indicadores).
 */
App::$app->get('/services/api/automation/GetWorks', function (Request $request) {
	AutomationAuth::Authenticate();

	$controller = new services\WorkService();
	return App::Json($controller->GetCurrentUserWorks());
});

/**
 * Lista las cartografías de sitio para usuarios administradores.
 *
 * Respuesta: array de objetos Work (resumen, sin datasets ni indicadores).
 */
App::$app->get('/services/api/automation/GetSiteWorks', function (Request $request) {
	AutomationAuth::Authenticate();

	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new adminServices\WorkService();
	$filter = Params::Get('f', null);
	$ret = $controller->GetWorksByType($filter);
	return App::Json($ret);

});

/**
 * Actualiza los metadatos de una cartografía.
 * Solo se modifican los campos provistos; los omitidos se mantienen sin cambios.
 *
 * Parámetros POST:
 *   w        (int, obligatorio)   – work ID
 *   title    (string, opcional)   – nuevo título
 *   abstract (string, opcional)   – resumen corto (≤ 400 caracteres)
 *   authors  (string, opcional)   – autores (texto libre)
 *   language (string, opcional)   – idioma (ej. 'es; Español')
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/UpdateMetadata', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$work     = App::Orm()->find(entities\DraftWork::class, $workId);
	$metadata = $work->getMetadata();

	$title    = Params::Get('title');
	$abstract = Params::Get('abstract');
	$abstractLong = Params::Get('abstractLong');
	$authors  = Params::Get('authors');
	$language = Params::Get('language');

	if ($title    !== null) $metadata->setTitle($title);
	if ($abstract !== null) $metadata->setAbstract($abstract);
	if ($abstractLong !== null) $metadata->setAbstractLong($abstractLong);
	if ($authors  !== null) $metadata->setAuthors($authors);
	if ($language !== null) $metadata->setLanguage($language);

	$controller = new services\MetadataService();
	$controller->UpdateMetadata($workId, $metadata);

	return App::Json(['result' => 'ok']);
});

/**
 * Cambia la visibilidad de una cartografía.
 *
 * Parámetros POST:
 *   w       (int, obligatorio)  – work ID
 *   private (bool, obligatorio) – 1 = privado, 0 = público
 *   link    (string, opcional)  – slug de acceso por enlace (solo si private=0)
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/UpdateWorkVisibility', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId  = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$private = Params::GetBoolMandatory('private');
	$link    = Params::Get('link');

	$controller = new services\WorkService();
	$controller->UpdateWorkVisibility($workId, $private, $link);

	return App::Json(['result' => 'ok']);
});


/**
 * Agregar un indicador externo a la cartografía.
 *
 * Parámetros Get:
 *   w       (int, obligatorio)  – work ID
 *   m		 (string, obligatorio) – nombre del indicador
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/AppendExtraMetric', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId))
		return $denied;

	$metric = Params::GetMandatory('m');

	$controller = new services\WorkService();
	$controller->AppendExtraMetricByName($workId, $metric);

	return App::Json(['result' => 'ok']);
});

/**
 * Descarga todos los datasets de una cartografía como archivo ZIP.
 * El ZIP incluye los datasets y un archivo metadata.json, pero no el PDF
 * de metadatos (descargable por separado vía GetWorkMetadataPdf).
 *
 * Parámetros GET:
 *   w (int, obligatorio) – work ID
 *
 * Respuesta: archivo ZIP (stream).
 */
App::$app->get('/services/api/automation/DownloadWorkDatasets', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$controller = new apiServices\AutomationService();
	return $controller->DownloadWorkDatasets($workId);
});

/**
 * Descarga el PDF de metadatos de una cartografía.
 *
 * Parámetros GET:
 *   w (int, obligatorio) – work ID
 *
 * Respuesta: archivo PDF (stream).
 */
App::$app->get('/services/api/automation/GetWorkMetadataPdf', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$controller = new apiServices\AutomationService();
	return $controller->StreamWorkMetadataPdf($workId);
});

// ******* Publicación (multi-paso) ********************************************

/**
 * Inicia la publicación de una cartografía.
 *
 * Parámetros GET:
 *   w (int, obligatorio) – work ID
 *
 * Respuesta: { done, key, status, step, totalSteps, ellapsed }
 */
App::$app->get('/services/api/automation/StartPublishWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\PublishService();
	return App::Json($controller->StartPublication($workId));
});

App::$app->get('/services/api/automation/StepPublishWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$key = Params::GetMandatory('k');
	$controller = new services\PublishService();
	return App::Json($controller->StepPublication($key));
});

// ******* Revocación (multi-paso) *********************************************

/**
 * Inicia la revocación de la publicación de una cartografía.
 *
 * Parámetros GET:
 *   w (int, obligatorio) – work ID
 */
App::$app->get('/services/api/automation/StartRevokeWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\RevokeService();
	return App::Json($controller->StartRevoke($workId));
});

App::$app->get('/services/api/automation/StepRevokeWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$key = Params::GetMandatory('k');
	$controller = new services\RevokeService();
	return App::Json($controller->StepRevoke($key));
});

// ******* Eliminación (multi-paso) ********************************************

/**
 * Inicia la eliminación de una cartografía y todos sus contenidos.
 *
 * Parámetros GET:
 *   w (int, obligatorio) – work ID
 */
App::$app->get('/services/api/automation/StartDeleteWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\WorkDeleteService();
	return App::Json($controller->StartDeleteWork($workId));
});

App::$app->get('/services/api/automation/StepDeleteWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$key = Params::GetMandatory('k');
	$controller = new services\WorkDeleteService();
	return App::Json($controller->StepDeleteWork($key));
});

// ******* Clonación (multi-paso) **********************************************

/**
 * Inicia la clonación de una cartografía.
 *
 * Parámetros GET:
 *   w    (int, obligatorio)    – work ID a clonar
 *   name (string, obligatorio) – nombre de la copia
 */
App::$app->get('/services/api/automation/StartCloneWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$name = Params::GetMandatory('name');
	$controller = new services\WorkCloneService();
	return App::Json($controller->StartCloneWork($workId, $name));
});

App::$app->get('/services/api/automation/StepCloneWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$key = Params::GetMandatory('k');
	$controller = new services\WorkCloneService();
	return App::Json($controller->StepCloneWork($key));
});
