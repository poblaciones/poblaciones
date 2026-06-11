<?php

/**
 * Endpoints de automatización para boundaries (cartografías base).
 *
 * Autenticación: todas las rutas requieren el header X-Api-Key o el parámetro api_key.
 *
 * Operaciones de un solo paso:
 *   GET /api/automation/GetBoundaries           – lista todas las boundaries públicas
 *   GET /api/automation/GetBoundaryVersions     – versiones de una boundary
 *
 * Descarga de versión (multi-paso):
 *   GET /api/automation/StartDownloadBoundaryVersion → GET /api/automation/StepDownloadBoundaryVersion?k=...
 *   GET /api/automation/GetBoundaryVersionFile       – descarga el archivo generado
 */

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\AutomationAuth;
use helena\db\frontend\BoundaryModel;
use helena\services\frontend\BoundaryService;
use helena\services\frontend\DownloadBoundaryService;
use helena\services\frontend\TableService;
use minga\framework\Params;
use minga\framework\PublicException;

// ******* Catálogo ***********************************************************

/**
 * Lista todas las boundaries públicas disponibles en el sitio.
 *
 * Respuesta: array de { Id, Name, Group }
 */
App::$app->get('/services/api/automation/GetBoundaries', function (Request $request) {
	AutomationAuth::Authenticate();

	$model = new BoundaryModel();
	return App::Json($model->GetFabBoundaries());
});

/**
 * Retorna la información de una boundary junto con sus versiones disponibles.
 *
 * Parámetros GET:
 *   b (int, obligatorio) – boundary ID
 *
 * Respuesta: { Id, Name, Versions: [ { Id, Name }, ... ] }
 */
App::$app->get('/services/api/automation/GetBoundaryVersions', function (Request $request) {
	AutomationAuth::Authenticate();

	$boundaryId = Params::GetIntMandatory('b');

	$controller = new BoundaryService();
	$boundary   = $controller->GetSelectedBoundary($boundaryId);

	$versions = array_map(function ($v) {
		return [
			'Id'         => $v->Id,
			'Name'       => $v->Name,
			'MetadataId' => $v->Metadata ? $v->Metadata->Id : null,
		];
	}, $boundary->Versions);

	return App::Json([
		'Id'       => $boundary->Id,
		'Name'     => $boundary->Name,
		'Versions' => $versions,
	]);
});

// ******* Descarga de versión (multi-paso) ***********************************

/**
 * Inicia la generación del archivo de una versión de boundary.
 *
 * Parámetros GET:
 *   v    (int, obligatorio)    – boundary version ID
 *   type (string, obligatorio) – tipo de archivo (string de 2 caracteres,
 *                                ej. 'cs' CSV+WKT, 'gj' GeoJSON, 'sh' Shapefile, 'kl' KML)
 *
 * Respuesta: { done, key, status, step, totalSteps, ellapsed }
 */
App::$app->get('/services/api/automation/StartDownloadBoundaryVersion', function (Request $request) {
	AutomationAuth::Authenticate();

	$boundaryVersionId = Params::GetIntMandatory('v');
	$type              = Params::GetMandatory('type');

	if (strlen($type) !== 2) {
		throw new PublicException("El parámetro 'type' debe tener exactamente 2 caracteres (ej. 'cs', 'gj', 'sh', 'kl').");
	}

	$controller = new DownloadBoundaryService();
	return App::Json($controller->CreateMultiRequestFile($type, $boundaryVersionId, [], null));
});

/**
 * Avanza un paso en la generación del archivo de boundary.
 *
 * Parámetros GET:
 *   k (string, obligatorio) – clave devuelta por StartDownloadBoundaryVersion
 *
 * Respuesta: { done, key, status, step, totalSteps, ellapsed }
 */
App::$app->get('/services/api/automation/StepDownloadBoundaryVersion', function (Request $request) {
	AutomationAuth::Authenticate();

	$key        = Params::GetMandatory('k');
	$controller = new DownloadBoundaryService();
	return App::Json($controller->StepMultiRequestFile($key));
});

/**
 * Descarga el archivo de boundary generado por el stepper.
 * Debe llamarse después de que StepDownloadBoundaryVersion haya retornado done=true.
 *
 * Parámetros GET:
 *   v    (int, obligatorio)    – boundary version ID (igual que en Start)
 *   type (string, obligatorio) – tipo de archivo (igual que en Start)
 *
 * Respuesta: binario del archivo con Content-Type y Content-Disposition apropiados.
 */
App::$app->get('/services/api/automation/GetBoundaryVersionFile', function (Request $request) {
	AutomationAuth::Authenticate();

	$boundaryVersionId = Params::GetIntMandatory('v');
	$type              = Params::GetMandatory('type');

	if (strlen($type) !== 2) {
		throw new PublicException("El parámetro 'type' debe tener exactamente 2 caracteres.");
	}

	return DownloadBoundaryService::GetFileBytes($type, $boundaryVersionId, [], null);
});

// ******* Relaciones geográficas *********************************************

/**
 * Retorna las relaciones entre los ítems de una boundary version y los
 * ítems de cada geography solicitada, incluyendo el código de georreferencia.
 *
 * Solo se retornan las geographies que son efectivamente hijas de la boundary
 * version; las que no lo son quedan como array vacío.
 *
 * Parámetros GET:
 *   v    (int, obligatorio)      – boundary version ID
 *   g[]  (int[], obligatorio)    – IDs de geographies a consultar
 *
 * Respuesta: { geographyId: [ { FID, GID, Code }, ... ], ... }
 *            Las geographies sin relación retornan array vacío.
 */
App::$app->get('/services/api/automation/GetBoundaryVersionRelations', function (Request $request) {
	AutomationAuth::Authenticate();

	$boundaryVersionId = Params::GetIntMandatory('v');
	$geographyIds      = Params::GetIntArray('g');

	$controller = new TableService();
	$result     = $controller->GetRegionGeographyRelations($boundaryVersionId, $geographyIds, true);

	return App::Json($result);
});
