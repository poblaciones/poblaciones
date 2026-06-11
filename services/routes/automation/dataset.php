<?php

/**
 * Endpoints de automatización para operaciones a nivel Dataset.
 *
 * Autenticación: todas las rutas requieren X-Api-Key o ?api_key=.
 *
 * Ciclo completo de carga de un dataset:
 *
 *   1. POST /api/automation/CreateDataset
 *   2. POST /api/automation/UploadFileChunk          (sube el archivo al bucket temporal)
 *   3. GET  /api/automation/StartImportFile          (inicia el import multi-paso)
 *        → GET /api/automation/StepImportFile?k=...  (polling)
 *   4. GET  /api/automation/GetDatasetColumns        (para resolver nombres de columna a IDs)
 *   5a. GET /api/automation/StartGeoreferenceByCodes
 *        → GET /api/automation/StepGeoreference?k=...
 *   5b. GET /api/automation/StartGeoreferenceByLatLong
 *        → GET /api/automation/StepGeoreference?k=...
 *   5c. GET /api/automation/StartGeoreferenceByShapes
 *        → GET /api/automation/StepGeoreference?k=...
 *
 *   Si la georreferenciación devuelve errores (done=true, step < totalSteps):
 *   6. GET  /api/automation/GetDatasetErrors
 *   7. POST /api/automation/OmmitAllDatasetErrors    (omite todas las filas con errores)
 *      Luego repetir paso 5 con reset=0 para continuar.
 *
 *   Opcionales:
 *   POST /api/automation/UpdateDatasetIdentity
 *   POST /api/automation/SetColumnLabels
 *   POST /api/automation/LinkMultilevel
 */

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\classes\AutomationAuth;
use helena\services\backoffice as services;
use helena\entities\backoffice as entities;
use minga\framework\Params;
use minga\framework\PublicException;

// ******* Creación ***********************************************************

/**
 * Crea un dataset vacío dentro de una cartografía.
 *
 * Parámetros POST:
 *   w     (int, obligatorio)    – work ID
 *   name  (string, obligatorio) – nombre del dataset
 *
 * Respuesta: objeto DraftDataset serializado (incluye Id).
 */
App::$app->post('/services/api/automation/CreateDataset', function (Request $request) {
	AutomationAuth::Authenticate();

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$name = Params::GetMandatory('name');

	$controller = new services\DatasetService();
	$entity = $controller->Create($workId, $name);
	return App::OrmJson($entity);
});

// ******* Upload e import ****************************************************

/**
 * Sube un chunk de archivo al bucket temporal del servidor.
 * El bucket ID es generado por el cliente (ej. timestamp+random).
 *
 * Parámetros GET:
 *   b (string, obligatorio) – bucket ID generado por el cliente
 *
 * Cuerpo: multipart/form-data con el archivo en cualquier campo.
 *
 * Respuesta: { status: "OK", bucket, extension }
 */
App::$app->post('/services/api/automation/UploadFileChunk', function (Request $request) {
	AutomationAuth::Authenticate();

	$bucketId = Params::GetMandatory('b');
	$controller = new services\ImportService();
	return App::Json($controller->FileChunkImport($bucketId));
});

/**
 * Inicia el proceso multi-paso de importar el archivo subido a un dataset.
 *
 * Parámetros GET:
 *   d   (int, obligatorio)    – dataset ID
 *   b   (string, obligatorio) – bucket ID (el mismo usado en UploadFileChunk)
 *   fe  (string, obligatorio) – extensión del archivo sin punto (ej. 'sav', 'csv', 'xlsx')
 *   k   (int, opcional)       – 1 = conservar etiquetas del archivo (default: 1)
 *   s   (int, opcional)       – índice de hoja para Excel (default: 0)
 *
 * Respuesta: { done, key, status, step, totalSteps }
 */
App::$app->get('/services/api/automation/StartImportFile', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$bucketId          = Params::GetMandatory('b');
	$fileExtension     = Params::GetMandatory('fe');
	$keepLabels        = Params::GetInt('k', 1) === 1;
	$selectedSheetIndex = Params::GetInt('s', -1);

	$controller = new services\ImportService();
	return App::Json($controller->CreateMultiImportFile(
		$datasetId, $bucketId, $fileExtension, $keepLabels, $selectedSheetIndex
	));
});

/**
 * Avanza un paso en el import iniciado con StartImportFile.
 *
 * Parámetros GET:
 *   k (string, obligatorio) – key devuelta por StartImportFile
 */
App::$app->get('/services/api/automation/StepImportFile', function (Request $request) {
	AutomationAuth::Authenticate();

	$key = Params::GetMandatory('k');
	$controller = new services\ImportService();
	return App::Json($controller->StepMultiImportFile($key));
});

// ******* Columnas ***********************************************************

/**
 * Retorna las columnas de un dataset con sus IDs, nombres, tipos y etiquetas.
 * Usado principalmente para resolver nombres de columna a IDs antes de georreferenciar.
 *
 * Parámetros GET:
 *   d (int, obligatorio) – dataset ID
 *
 * Respuesta: array de objetos DraftDatasetColumn.
 */
App::$app->get('/services/api/automation/GetDatasetColumns', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;

	$controller = new services\DatasetColumnService();
	return App::OrmJson($controller->GetDatasetColumns($datasetId));
});

/**
 * Asigna etiquetas de valor a una columna.
 * Necesario para columnas numéricas importadas desde CSV que no traen etiquetas.
 *
 * Parámetros POST:
 *   c       (int, obligatorio)  – column ID
 *   labels  (JSON, obligatorio) – array de objetos etiqueta: [{"Value":1,"Caption":"Etiqueta"}, ...]
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/SetColumnLabels', function (Request $request) {
	AutomationAuth::Authenticate();

	$columnId = Params::GetIntMandatory('c');
	$col      = App::Orm()->find(entities\DraftDatasetColumn::class, $columnId);
	if ($denied = Session::CheckIsDatasetEditor($col->getDataset()->getId())) return $denied;

	$labels = Params::GetJsonMandatory('labels');

	$controller = new services\DatasetColumnService();
	// $deletedLabels vacío: solo creamos/actualizamos, no borramos
	$controller->UpdateLabels($columnId, $labels, []);

	return App::Json(['result' => 'ok']);
});

// ******* Georreferenciación *************************************************

/**
 * Inicia la georreferenciación por código geográfico (ej. código de departamento).
 *
 * Parámetros GET:
 *   d       (int, obligatorio) – dataset ID
 *   geo_id  (int, obligatorio) – ID de la geografía (ver GetAllGeographies)
 *   col_id  (int, obligatorio) – ID de la columna que contiene los códigos
 *   reset   (int, opcional)    – 1 = reiniciar desde cero (default: 1), 0 = continuar
 *
 * Respuesta: { done, key, status, step, totalSteps, errorsFound }
 */
App::$app->get('/services/api/automation/StartGeoreferenceByCodes', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId   = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$geographyId  = Params::GetIntMandatory('geo_id');
	$codesColumnId = Params::GetIntMandatory('col_id');
	$reset         = Params::Get('reset', '1');

	$controller = new services\GeoreferenceService();
	return App::Json($controller->CreateMultiGeoreferenceByCodes(
		$datasetId,
		$geographyId, $codesColumnId,
		null, null,       // sin segmentos
		false,            // georeferenceSegments = false
		$reset
	));
});

/**
 * Inicia la georreferenciación por latitud y longitud.
 *
 * Parámetros GET:
 *   d        (int, obligatorio) – dataset ID
 *   geo_id   (int, obligatorio) – ID de la geografía de tracking (normalmente Radios)
 *   lat_id   (int, obligatorio) – ID de la columna de latitud
 *   lon_id   (int, obligatorio) – ID de la columna de longitud
 *   reset    (int, opcional)    – 1 = reiniciar (default: 1), 0 = continuar
 *
 * Respuesta: { done, key, status, step, totalSteps, errorsFound }
 */
App::$app->get('/services/api/automation/StartGeoreferenceByLatLong', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId   = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$gs = new services\GeographyService();
	$geographyId  = $gs->GetTrackingLevelId();

	$latColumnId  = Params::GetIntMandatory('lat_id');
	$lonColumnId  = Params::GetIntMandatory('lon_id');
	$reset        = Params::Get('reset', '1');

	$controller = new services\GeoreferenceService();
	return App::Json($controller->CreateMultiGeoreferenceByLatLong(
		$datasetId, $geographyId,
		$latColumnId, $lonColumnId,
		null, null,   // sin segmentos
		false,        // georeferenceSegments = false
		$reset
	));
});

/**
 * Inicia la georreferenciación por polígonos (columna WKT o GeoJSON).
 *
 * Parámetros GET:
 *   d        (int, obligatorio) – dataset ID
 *   geo_id   (int, obligatorio) – ID de la geografía de referencia
 *   col_id   (int, obligatorio) – ID de la columna con los polígonos
 *   reset    (int, opcional)    – 1 = reiniciar (default: 1)
 */
App::$app->get('/services/api/automation/StartGeoreferenceByShapes', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId  = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$geographyId   = Params::GetIntMandatory('geo_id');
	$shapesColumnId = Params::GetIntMandatory('col_id');
	$reset         = Params::Get('reset', '1');

	$controller = new services\GeoreferenceService();
	return App::Json($controller->CreateMultiGeoreferenceByShapes(
		$datasetId, $geographyId, $shapesColumnId, $reset
	));
});

/**
 * Avanza un paso en la georreferenciación.
 *
 * Parámetros GET:
 *   k (string, obligatorio) – key devuelta por cualquier StartGeoreference*
 */
App::$app->get('/services/api/automation/StepGeoreference', function (Request $request) {
	AutomationAuth::Authenticate();

	$key = Params::GetMandatory('k');
	$controller = new services\GeoreferenceService();
	return App::Json($controller->StepMultiGeoreference($key));
});

// ******* Errores de georreferenciación **************************************

/**
 * Retorna las filas del dataset que no pudieron ser georreferenciadas.
 *
 * Parámetros GET:
 *   d (int, obligatorio) – dataset ID
 *
 * Respuesta: { TotalRows, Data: [[error, ...campos...], ...] }
 */
App::$app->get('/services/api/automation/GetDatasetErrors', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;

	$controller = new services\DatasetService();
	return App::Json($controller->GetDatasetErrors($datasetId, 0, 500));
});

/**
 * Marca como omitidas todas las filas con errores de georreferenciación.
 * Después de esto se puede relanzar la georreferenciación con reset=0.
 *
 * Parámetros POST:
 *   d (int, obligatorio) – dataset ID
 *
 * Respuesta: { completed: true, affected: N }
 */
App::$app->post('/services/api/automation/OmmitAllDatasetErrors', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$controller = new services\DatasetService();
	$result = $controller->OmmitDatasetAllRows($datasetId);
	return App::Json($result);
});

// ******* Identidad del dataset **********************************************

/**
 * Actualiza propiedades de presentación del dataset.
 * Solo se modifican los campos provistos; los omitidos se mantienen sin cambios.
 *
 * Parámetros POST:
 *   d                (int, obligatorio)  – dataset ID
 *   caption_col_id   (int, opcional)     – ID de la columna de descripción de cada elemento
 *   show_info        (int, opcional)     – 1 = mostrar ficha de resumen, 0 = no
 *   skip_empty       (int, opcional)     – 1 = omitir campos vacíos en la ficha, 0 = no
 *   marker_size      (string, opcional)  – 'S' | 'M' | 'L'
 *   marker_frame     (string, opcional)  – 'C' círculo | 'P' pin | 'B' cuadrado
 *   marker_type      (string, opcional)  – 'I' ícono | 'T' texto
 *   marker_text      (string, opcional)  – texto del marcador si marker_type='T' (máx. 4 chars)
 *   marker_autoscale (int, opcional)     – 1 = ajustar tamaño al zoom, 0 = no
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/UpdateDatasetIdentity', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);

	// Columna de descripción
	$captionColId = Params::GetInt('caption_col_id');
	if ($captionColId !== null) {
		$col = App::Orm()->find(entities\DraftDatasetColumn::class, $captionColId);
		$dataset->setCaptionColumn($col);
	}

	// Ficha de resumen
	$showInfo = Params::GetInt('show_info');
	if ($showInfo !== null) {
		$dataset->setShowInfo($showInfo === 1);
	}

	$skipEmpty = Params::GetInt('skip_empty');
	if ($skipEmpty !== null) {
		$dataset->setSkipEmptyFields($skipEmpty === 1);
	}

	// Marcador (solo relevante para datasets de puntos, Type='L')
	$marker = $dataset->getMarker();
	if ($marker !== null) {
		$markerSize      = Params::Get('marker_size');
		$markerFrame     = Params::Get('marker_frame');
		$markerType      = Params::Get('marker_type');
		$markerText      = Params::Get('marker_text');
		$markerAutoscale = Params::GetInt('marker_autoscale');

		if ($markerSize      !== null) $marker->setSize($markerSize);
		if ($markerFrame     !== null) $marker->setFrame($markerFrame);
		if ($markerType      !== null) $marker->setType($markerType);
		if ($markerText      !== null) $marker->setText($markerText);
		if ($markerAutoscale !== null) $marker->setAutoScale($markerAutoscale === 1);
	}

	$controller = new services\DatasetService();
	$controller->UpdateDataset($dataset);

	return App::Json(['result' => 'ok']);
});

// ******* Multinivel *********************************************************

/**
 * Vincula dos datasets como niveles del mismo indicador multinivel.
 * Llamar nuevamente con los mismos IDs los desvincula (toggle).
 *
 * El valor de MultilevelMatrix se calcula server-side: se reutiliza el valor
 * que ya tenga d1 (si pertenece a un grupo existente), o se asigna el próximo
 * entero libre tomando el máximo actual entre todos los datasets de la cartografía.
 *
 * Parámetros POST:
 *   d1 (int, obligatorio) – dataset ID del primer nivel
 *   d2 (int, obligatorio) – dataset ID del segundo nivel
 *
 * Respuesta: resultado del servicio UpdateMultilevelMatrix.
 */
App::$app->post('/services/api/automation/LinkMultilevel', function (Request $request) {
	AutomationAuth::Authenticate();

	$dataset1Id = Params::GetIntMandatory('d1');
	if ($denied = Session::CheckIsDatasetEditor($dataset1Id)) return $denied;

	$dataset2Id = Params::GetIntMandatory('d2');
	if ($denied = Session::CheckIsDatasetEditor($dataset2Id)) return $denied;

	$dataset1 = App::Orm()->find(entities\DraftDataset::class, $dataset1Id);
	$dataset2 = App::Orm()->find(entities\DraftDataset::class, $dataset2Id);

	// Si d1 ya tiene matrix asignada, reutilizarla para preservar el grupo existente.
	// Si no, calcular el próximo entero libre entre todos los datasets de la cartografía
	// (mismo algoritmo que AcquireMultilevelMatrix en el cliente JS).
	$matrix1 = $dataset1->getMultilevelMatrix();
	if ($matrix1 === null) {
		$work      = $dataset1->getWork();
		$ws = new services\WorkService();
		$datasets  = $ws->GetDatasets($work->getId());
		$max       = 1;
		foreach ($datasets as $ds) {
			if ($ds->getId() !== $dataset1Id &&
				$ds->getId() !== $dataset2Id &&
				$ds->getMultilevelMatrix() !== null &&
				(int) $ds->getMultilevelMatrix() >= $max) {
				$max = (int) $ds->getMultilevelMatrix() + 1;
			}
		}
		$matrix1 = (string) $max;
	}
	$matrix2 = $matrix1; // ambos datasets quedan en el mismo grupo

	$controller = new services\DatasetService();
	return App::Json($controller->UpdateMultilevelMatrix($dataset1Id, $matrix1, $dataset2Id, $matrix2));
});
