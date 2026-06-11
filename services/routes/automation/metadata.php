<?php

/**
 * Endpoints de automatización para metadatos, fuentes, instituciones y permisos.
 *
 * Autenticación: todas las rutas requieren X-Api-Key o ?api_key=.
 *
 *   GET  /api/automation/GetAvailableSources        – fuentes accesibles al usuario
 *   POST /api/automation/AddSourceToWork            – vincula fuente a cartografía por ID
 *   POST /api/automation/CreateAndAddSource         – crea fuente nueva y la vincula
 *   GET  /api/automation/GetAvailableInstitutions   – instituciones accesibles al usuario
 *   POST /api/automation/AddInstitutionToWork       – vincula institución por ID
 *   POST /api/automation/CreateAndAddInstitution    – crea institución nueva y la vincula
 *   POST /api/automation/SetWorkPermission         – asigna permiso a un usuario sobre la cartografía
 *   POST /api/automation/RemoveWorkPermission      – revoca permiso
 */

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\classes\AutomationAuth;
use helena\services\backoffice as services;
use helena\entities\backoffice as entities;
use minga\framework\Params;
use minga\framework\PublicException;

// ******* Fuentes secundarias *************************************************

/**
 * Lista todas las fuentes accesibles al usuario autenticado.
 * Incluye las fuentes públicas del sistema y las creadas por el usuario.
 *
 * Respuesta: array de { Id, Caption, Authors, Version, Web, Institution: { Caption } }
 */
App::$app->get('/services/api/automation/GetAvailableSources', function (Request $request) {
	AutomationAuth::Authenticate();

	$controller = new services\SourceService();
	return App::OrmJson($controller->GetAllSourcesByCurrentUser());
});

/**
 * Vincula una fuente existente a una cartografía por ID.
 *
 * Parámetros POST:
 *   w          (int, obligatorio) – work ID
 *   source_id  (int, obligatorio) – ID de la fuente (obtenido de GetAvailableSources)
 *
 * Respuesta: objeto fuente serializado.
 */
App::$app->post('/services/api/automation/AddSourceToWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId   = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$sourceId = Params::GetIntMandatory('source_id');
	$work     = App::Orm()->find(entities\DraftWork::class, $workId);
	$metadataId = $work->getMetadata()->getId();

	$controller = new services\SourceService();
	$ret = $controller->AddSourceToMetadata($workId, $metadataId, $sourceId);
	return App::OrmJson($ret);
});

/**
 * Crea una fuente nueva y la vincula a la cartografía.
 *
 * Parámetros POST:
 *   w           (int, obligatorio)    – work ID
 *   name        (string, obligatorio) – nombre de la fuente
 *   edition     (string, opcional)    – año o versión de la fuente
 *   authors     (string, opcional)    – autores individuales de la fuente
 *   web         (string, opcional)    – URL de la fuente
 *   institution (string, opcional)    – nombre de la institución productora
 *
 * Respuesta: { result: "ok", source_id }
 */
App::$app->post('/services/api/automation/CreateOrReuseAndAddSource', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$name        = Params::GetMandatory('name');
	$edition     = Params::Get('edition');
	$authors     = Params::Get('authors');
	$web         = Params::Get('web');
	$instCaption = Params::Get('institution');

	//
	$controller = new services\SourceService();

	// Construir la entidad Source
	$source = new entities\DraftSource();
	$source->setCaption($name);
	$source->setIsGlobal(true);
	if ($edition  !== null) $source->setVersion($edition);
	if ($authors  !== null) $source->setAuthors($authors);
	if ($web      !== null) $source->setWeb($web);

	// Resolver o crear la institución de la fuente si se indicó
	if ($instCaption !== null) {
		$instController = new services\InstitutionService();
		$institution = $instController->FindOrCreateByCaption($instCaption);
		$source->setInstitution($institution);
	}

	$work = App::Orm()->find(entities\DraftWork::class, $workId);
	$metadataId = $work->getMetadata()->getId();

	$saved = $controller->Update($workId, $metadataId, $source);
	$sourceId = $saved->getId();

	// Vincular a la cartografía
	$controller->AddSourceToMetadata($workId, $metadataId, $sourceId);

	return App::Json(['result' => 'ok', 'source_id' => $sourceId]);
});

// ******* Instituciones *******************************************************

/**
 * Lista las instituciones accesibles al usuario.
 *
 * Respuesta: array de { Id, Caption, Web, Country }
 */
App::$app->get('/services/api/automation/GetAvailableInstitutions', function (Request $request) {
	AutomationAuth::Authenticate();

	$controller = new services\InstitutionService();
	return App::OrmJson($controller->GetAllInstitutionsByCurrentUser());
});

/**
 * Vincula una institución existente a una cartografía como institución responsable.
 *
 * Parámetros POST:
 *   w               (int, obligatorio) – work ID
 *   institution_id  (int, obligatorio) – ID de la institución
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/AddInstitutionToWork', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId        = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$institutionId = Params::GetIntMandatory('institution_id');
	$work          = App::Orm()->find(entities\DraftWork::class, $workId);
	$metadataId    = $work->getMetadata()->getId();

	$controller = new services\InstitutionService();
	$controller->AddInstitutionToMetadata($workId, $metadataId, $institutionId);

	return App::Json(['result' => 'ok']);
});

/**
 * Crea una institución nueva y la vincula a la cartografía.
 *
 * Parámetros POST:
 *   w            (int, obligatorio)    – work ID
 *   name         (string, obligatorio) – nombre completo de la institución
 *   web          (string, opcional)    – sitio web
 *   email        (string, opcional)    – correo institucional
 *   country      (string, opcional)    – país
 *   address      (string, opcional)    – dirección postal
 *   primary_color (string, opcional)   – color primario hex sin # (para marca de agua)
 *
 * Respuesta: { result: "ok", institution_id }
 */
App::$app->post('/services/api/automation/CreateAndAddInstitution', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$name         = Params::GetMandatory('name');
	$web          = Params::Get('web');
	$email        = Params::Get('email');
	$country      = Params::Get('country');
	$address      = Params::Get('address');
	$primaryColor = Params::Get('primary_color');

	$controller = new services\InstitutionService();
	$institution = $controller->GetNewInstitution();
	$institution->setCaption($name);

	if ($web          !== null) $institution->setWeb($web);
	if ($email        !== null) $institution->setEmail($email);
	if ($country      !== null) $institution->setCountry($country);
	if ($address      !== null) $institution->setAddress($address);
	if ($primaryColor !== null) $institution->setPrimaryColor($primaryColor);

	$saved = $controller->Update($institution, null);
	$institutionId = $saved->getId();

	$work = App::Orm()->find(entities\DraftWork::class, $workId);
	$metadataId = $work->getMetadata()->getId();
	$controller->AddInstitutionToMetadata($workId, $metadataId, $institutionId);

	return App::Json(['result' => 'ok', 'institution_id' => $institutionId]);
});

// ******* Permisos ************************************************************

/**
 * Asigna o actualiza un permiso sobre la cartografía para un usuario.
 *
 * Parámetros POST:
 *   w          (int, obligatorio)    – work ID
 *   email      (string, obligatorio) – email del usuario a quien otorgar permiso
 *   permission (string, obligatorio) – 'V' ver | 'E' editar | 'A' administrar
 *   notify     (bool, opcional)      – enviar email de notificación (default: false)
 *
 * Respuesta: objeto permiso serializado.
 */
App::$app->post('/services/api/automation/SetWorkPermission', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId     = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId, true)) return $denied;

	$email      = Params::GetMandatory('email');
	$permission = Params::GetMandatory('permission');
	$notify     = Params::GetInt('notify', 0) === 1;

	if (!in_array($permission, ['V', 'E', 'A'])) {
		throw new PublicException("permission inválido. Valores válidos: V (ver), E (editar), A (administrar).");
	}

	$controller = new services\PermissionsService();
	$ret = $controller->AssignPermission($workId, $email, $permission, $notify);
	return App::OrmJson($ret);
});

/**
 * Revoca un permiso sobre la cartografía.
 *
 * Parámetros POST:
 *   w             (int, obligatorio) – work ID
 *   permission_id (int, obligatorio) – ID del permiso a revocar
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/RemoveWorkPermission', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId       = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId, true)) return $denied;

	$permissionId = Params::GetIntMandatory('permission_id');

	$controller = new services\PermissionsService();
	$controller->RemovePermission($workId, $permissionId);

	return App::Json(['result' => 'ok']);
});

/**
 * Lista los permisos actuales de una cartografía.
 *
 * Parámetros GET:
 *   w (int, obligatorio) – work ID
 *
 * Respuesta: array de objetos permiso { Id, User: { Email }, Permission }
 */
App::$app->get('/services/api/automation/GetWorkPermissions', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;

	$controller = new services\PermissionsService();
	return App::OrmJson($controller->GetPermissions($workId));
});
