<?php

/**
 * Endpoints de automatización para operaciones a nivel Indicador (Metric/Variable).
 *
 * Autenticación: todas las rutas requieren X-Api-Key o ?api_key=.
 *
 * Ciclo típico para crear un indicador con una variable:
 *
 *   1. POST /api/automation/CreateIndicator
 *        → devuelve level_id, metric_version_id, metric_id
 *   2. POST /api/automation/AddVariable
 *        → devuelve variable_id
 *
 * Otras operaciones:
 *   GET  /api/automation/GetDatasetIndicators
 *   POST /api/automation/DeleteIndicator
 *   POST /api/automation/DeleteVariable
 */

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\classes\AutomationAuth;
use helena\services\backoffice as services;
use helena\entities\backoffice as entities;
use minga\framework\Params;
use minga\framework\PublicException;

// ******* Indicadores ********************************************************

/**
 * Lista los indicadores (MetricVersionLevel) de un dataset.
 *
 * Parámetros GET:
 *   d (int, obligatorio) – dataset ID
 *
 * Respuesta: array de objetos MetricVersionLevel con sus variables.
 */
App::$app->get('/services/api/automation/GetDatasetIndicators', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetReader($datasetId))
		return $denied;

	$controller = new services\MetricService();
	return App::OrmJson($controller->GetDatasetMetricVersionLevels($datasetId));
});

/**
 * Crea un indicador nuevo (o agrega una edición a uno existente) en un dataset.
 *
 * Para un indicador completamente nuevo:
 *   - No indicar metric_id; el sistema lo crea.
 *
 * Para agregar una edición a un indicador ya publicado en Poblaciones:
 *   - Indicar metric_id con el ID del indicador existente.
 *
 * Parámetros POST:
 *   d            (int, obligatorio)    – dataset ID
 *   name         (string, obligatorio) – nombre del indicador (ej. 'NBI')
 *   edition      (string, obligatorio) – año de referencia (ej. '2022')
 *   metric_id    (int, opcional)       – ID de un indicador existente a extender con nueva edición
 *
 * Respuesta: { level_id, metric_version_id, metric_id }
 */
App::$app->post('/services/api/automation/CreateIndicator', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId))
		return $denied;

	$name = Params::GetMandatory('name');
	$edition = Params::GetMandatory('edition');
	$metricId = Params::GetInt('metric_id');

	// Construir el objeto Level desde el factory, igual que hace la UI
	$ms = new services\MetricService();
	$level = $ms->GetNewMetricVersionLevel();
	$version = $level->getMetricVersion();
	$version->setCaption($edition);
	if ($metricId) {
		$metric = App::Orm()->find(entities\DraftMetric::class, $metricId);
		$version->setMetric($metric);
	} else {
		$version->getMetric()->setCaption($name);
	}

	$controller = new services\MetricService();
	$result = $controller->UpdateMetricVersionLevel($datasetId, $level);


	return App::Json([
		'level_id' => $result['LevelId'],
		'metric_version_id' => $result['MetricVersionId'],
		'metric_id' => $result['MetricId'],
	]);
});

/**
 * Agrega una variable a un indicador existente.
 *
 * Construye el objeto Variable internamente a partir de parámetros simples,
 * usando los valores por defecto del factory cuando no se especifica algo.
 *
 * Parámetros POST:
 *   d                    (int, obligatorio)    – dataset ID
 *   level_id             (int, obligatorio)    – level ID devuelto por CreateIndicator
 *   caption              (string, obligatorio) – nombre de la variable (ej. 'Porcentaje NBI')
 *   data_column_id       (int, opcional)       – ID de la columna de datos; si se omite se usa Conteo
 *   normalization_col_id (int, opcional)       – ID de la columna de normalización
 *   normalization_scale  (int, opcional)       – escala de normalización: 100 (%), 1000 (‰) (default: 100)
 *   cut_mode             (string, opcional)    – 'S' simple | 'J' Jenks | 'T' ntiles | 'M' manual | 'V' categorías (default: 'J')
 *   categories           (int, opcional)       – cantidad de cortes, 2–10 (default: 4)
 *   round                (float, opcional)     – redondeo: 0 | 1 | 2.5 | 5 | 10 | 100 | 1000 (default: 5)
 *   palette_type         (string, opcional)    – 'P' paleta predefinida | 'G' gradiente (default: 'P')
 *   palette              (int, opcional)       – ID de paleta (default: 2 = verde-rojo)
 *   color_from           (string, opcional)    – color inicial del gradiente en hex sin # (default: '0ce800')
 *   color_to             (string, opcional)    – color final del gradiente en hex sin # (default: 'fb0000')
 *   opacity              (string, opcional)    – 'L' baja | 'M' media | 'H' alta (default: 'M')
 *   show_totals          (bool, opcional)      – mostrar totales en el panel (default: true)
 *   null_category        (bool, opcional)      – mostrar categoría nula en la leyenda (default: true)
 *
 * Respuesta: { result: "ok", variable_id, order }
 */
App::$app->post('/services/api/automation/AddVariable', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId))
		return $denied;

	$levelId = Params::GetIntMandatory('level_id');
	$caption = Params::GetMandatory('caption');
	$legend = Params::Get('legend');
	$dataColumnId = Params::GetInt('data_column_id');
	$normColId = Params::GetInt('normalization_column_id');
	$normScale = Params::GetInt('normalization_scale', 100);
	$cutMode = Params::Get('cut_mode', 'J');
	$cutColumnId = Params::Get('cut_column_id');
	$categories = Params::GetInt('categories', 4);
	$round = Params::Get('round', '5');
	$paletteType = Params::Get('palette_type', 'P');
	$palette = Params::GetInt('palette', 2);
	$colorFrom = Params::Get('color_from', '0ce800');
	$colorTo = Params::Get('color_to', 'fb0000');
	$opacity = Params::Get('opacity', 'M');
	$showTotals = Params::GetInt('show_totals', 1) === 1;
	$nullCategory = Params::GetInt('null_category', 1) === 1;

	if ($categories < 2 || $categories > 10) {
		throw new PublicException('categories debe estar entre 2 y 10.');
	}
	if (!in_array($cutMode, ['S', 'J', 'T', 'M', 'V'])) {
		throw new PublicException("cut_mode inválido. Valores válidos: S, J, T, M, V.");
	}
	if (!in_array($paletteType, ['P', 'G'])) {
		throw new PublicException("palette_type inválido. Valores válidos: P, G.");
	}

	// Determinar si el dato es columna (O) o conteo (N)
	$dataType = ($dataColumnId !== null) ? 'O' : 'N';


	// Construir DataColumn (si aplica)
	$dataColumnObj = null;
	if ($dataColumnId !== null) {
		$dataColumnObj = App::Orm()->find(entities\DraftDatasetColumn::class, $dataColumnId);
	}

	// Construir NormalizationColumn (si aplica)
	$normType = null;
	$normColObj = null;
	if ($normColId !== null) {
		$normType = 'O';
		$normColObj = App::Orm()->find(entities\DraftDatasetColumn::class, $normColId);
	}

	// Construir DataColumn (si aplica)
	$cutColumnObj = null;
	if ($cutColumnId !== null) {
		$cutColumnObj = App::Orm()->find(entities\DraftDatasetColumn::class, $cutColumnId);
	}

	$ms = new services\MetricService();
	$variable = $ms->GetNewVariable();
	$variable->setCaption($caption);
	$variable->setLegend($legend);
	$variable->setData($dataType);
	$variable->setDataColumn($dataColumnObj);

	$variable->setNormalization($normType);
	$variable->setNormalizationScale($normScale);
	$variable->setNormalizationColumn($normColObj);

	$symbology = $variable->getSymbology();
	$symbology->setColorFrom($colorFrom);
	$symbology->setColorTo($colorTo);
	$symbology->setRainbow($palette);
	$symbology->setOpacity($opacity);
	$symbology->setGradientOpacity($opacity);
	$symbology->setShowTotals($showTotals);
	$symbology->setRound((float) $round);
	$symbology->setCategories($categories);
	$symbology->setCutMode($cutMode);
	$symbology->setCutColumn($cutColumnObj);

	$symbology->setNullCategory($nullCategory);
	$symbology->setPaletteType($paletteType);

	// Recargar el level desde la base para pasarlo al servicio
	$level = App::Orm()->find(entities\DraftMetricVersionLevel::class, $levelId);

	$controller = new services\MetricService();
	$result = $controller->UpdateVariable($datasetId, $level, $variable);

	return App::Json([
		'result' => 'ok',
		'variable_id' => $result['VariableId'],
		'order' => $result['Order'],
	]);
});

/**
 * Elimina un indicador completo (MetricVersionLevel) con todas sus variables.
 *
 * Parámetros POST:
 *   d        (int, obligatorio) – dataset ID
 *   level_id (int, obligatorio) – level ID
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/DeleteIndicator', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId))
		return $denied;

	$levelId = Params::GetIntMandatory('level_id');

	$controller = new services\MetricService();
	$controller->DeleteMetricVersionLevel($datasetId, $levelId);

	return App::Json(['result' => 'ok']);
});

/**
 * Elimina una variable de un indicador.
 *
 * Parámetros POST:
 *   d           (int, obligatorio) – dataset ID
 *   level_id    (int, obligatorio) – level ID
 *   variable_id (int, obligatorio) – variable ID
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/DeleteVariable', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId))
		return $denied;

	$levelId = Params::GetIntMandatory('level_id');
	$variableId = Params::GetIntMandatory('variable_id');

	$controller = new services\MetricService();
	$controller->DeleteVariable($datasetId, $levelId, $variableId);

	return App::Json(['result' => 'ok']);
});


// ******* Distribuciones (para generación de categorías) *********************

/**
 * Retorna los datos de distribución de una variable (jenks, ntiles, min, hasNulls).
 * Usado por el cliente para generar el array Values antes de llamar a UpdateVariableCategories.
 *
 * Parámetros GET:
 *   d   (int, obligatorio)    – dataset ID
 *   c   (string, obligatorio) – 'N' = conteo | 'O' = columna específica
 *   ci  (int, opcional)       – column ID (requerido si c='O')
 *   o   (string, opcional)    – tipo de normalización: 'N' = ninguna | 'O' = columna
 *   oi  (int, opcional)       – column ID de normalización (si o='O')
 *   s   (int, opcional)       – escala de normalización (ej. 100)
 *   f   (string, opcional)    – valor de filtro
 *
 * Respuesta: { Groups: { N: { jenks: [...], ntiles: [...] } }, MinValue, HasNulls }
 */
App::$app->get('/services/api/automation/GetColumnDistributions', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetReader($datasetId))
		return $denied;

	$dataColumn = Params::GetMandatory('c');
	$dataColumnId = Params::GetInt('ci');
	$normalizationColumn = Params::Get('o');
	$normalizationColumnId = Params::GetInt('oi');
	$normalizationScale = Params::Get('s');
	$filter = Params::Get('f');

	$controller = new services\MetricService();
	return App::Json($controller->GetColumnDistributions(
		$datasetId,
		$dataColumn,
		$dataColumnId,
		$normalizationColumn,
		$normalizationColumnId,
		$normalizationScale,
		$filter
	)
	);
});

/**
 * Retorna la distribución de valores de string de una columna categórica.
 * Usado para modo de corte V (categorías por etiqueta).
 *
 * Parámetros GET:
 *   d  (int, obligatorio) – dataset ID
 *   c  (int, obligatorio) – column ID
 *   f  (string, opcional) – valor de filtro
 *
 * Respuesta: array de { Value, Caption }
 */
App::$app->get('/services/api/automation/GetColumnStringDistributions', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetReader($datasetId))
		return $denied;

	$cutColumnId = Params::GetIntMandatory('c');
	$filter = Params::Get('f');

	$columns = new services\DatasetColumnService();
	$labels = $columns->GetDatasetColumnsLabels($datasetId, $cutColumnId);
	if (sizeof($labels) > 0)
	{
		$ret = $labels[$cutColumnId];
	}
	else
	{
		$controller = new services\MetricService();
		$ret = $controller->GetColumnStringDistributions($datasetId, $cutColumnId, $filter);
	}
	return App::Json($ret);
});

/**
 * Guarda el array Values generado (categorías, colores, rangos) en una variable existente.
 * Llamar siempre después de AddVariable para que la publicación tenga los datos completos.
 *
 * Parámetros POST:
 *   d           (int, obligatorio)  – dataset ID
 *   level_id    (int, obligatorio)  – level ID
 *   variable_id (int, obligatorio)  – variable ID devuelto por AddVariable
 *   values      (JSON, obligatorio) – array de objetos Value generados por el cliente
 *
 * Respuesta: { result: "ok" }
 */
App::$app->post('/services/api/automation/UpdateVariableCategories', function (Request $request) {
	AutomationAuth::Authenticate();

	$datasetId = Params::GetIntMandatory('d');
	if ($denied = Session::CheckIsDatasetEditor($datasetId))
		return $denied;

	$levelId = Params::GetIntMandatory('level_id');
	$variableId = Params::GetIntMandatory('variable_id');
	$newValues = Params::GetJsonMandatory('values');

	$level = App::Orm()->find(entities\DraftMetricVersionLevel::class, $levelId);
	$variableConnected = App::Orm()->find(entities\DraftVariable::class, $variableId);

	if ($variableConnected->getMetricVersionLevel()->getId() !== $levelId) {
		throw new PublicException('La variable no pertenece al level indicado.');
	}
	if ($variableConnected->getMetricVersionLevel()->getDataset()->getId() !== $datasetId) {
		throw new PublicException('La variable no pertenece al dataset indicado.');
	}

	$variable = new entities\DraftVariable();
	$variable->Values = $newValues;
	$variable->setId($variableId);

	$controller = new services\MetricService();
	$controller->UpdateVariableValues($variable, $variableConnected);

	return App::Json(['result' => 'ok']);
});