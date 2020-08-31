<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use minga\framework\PhpSession;
use helena\classes\Session;
use helena\services\backoffice as services;
use minga\framework\Params;
use helena\entities\backoffice as entities;
use minga\framework\Profiling;


// ******* Metric *********************************

App::$app->get('/services/backoffice/GetDatasetMetricVersionLevels', function (Request $request) {
	$controller = new services\MetricService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;
	$ret = App::OrmJson($controller->GetDatasetMetricVersionLevels($datasetId));
	return $ret;
});

App::$app->get('/services/backoffice/GetMetricVersionLevelVariables', function (Request $request) {
	$controller = new services\MetricService();
	$workId = Params::GetIntMandatory('w');
	$metricVersionLevelId = Params::GetIntMandatory('l');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;
	$ret = App::OrmJson($controller->GetMetricVersionLevelVariables($workId, $metricVersionLevelId));
	return $ret;
});


App::$app->get('/services/backoffice/GetWorkMetricVersions', function (Request $request) {
	$controller = new services\MetricService();
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;
	$ret = App::Json($controller->GetWorkMetricVersions($workId));
	return $ret;
});

App::$app->get('/services/backoffice/GetAllMetricGroups', function (Request $request) {
	$controller = new services\MetricService();
	$ret = App::OrmJson($controller->GetAllMetricGroups());
	return $ret;
});

App::$app->get('/services/backoffice/GetPublicMetrics', function (Request $request) {
	$controller = new services\MetricService();
	$ret = App::OrmJson($controller->GetPublicMetrics());
	return $ret;
});

App::$app->get('/services/backoffice/GetCartographyMetrics', function (Request $request) {
	$controller = new services\MetricService();
	$ret = App::OrmJson($controller->GetCartographyMetrics());
	return $ret;
});


App::Get('/services/backoffice/GetRelatedDatasets', function (Request $request) {
	$controller = new services\MetricService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;
	return App::Json($controller->GetRelatedDatasets($datasetId));
});

App::Get('/services/backoffice/LevelDatasetMetrics', function (Request $request) {
	$controller = new services\MetricService();
	$sourceDatasetId = Params::GetIntMandatory('sk');
	$targetDatasetId = Params::GetIntMandatory('tk');
	if ($denied = Session::CheckIsDatasetEditor($targetDatasetId)) return $denied;
	return App::Json(array('Affected' => $controller->LevelDatasetMetrics($sourceDatasetId, $targetDatasetId)));
});

App::Get('/services/backoffice/GetColumnDistributions', function (Request $request) {
	$controller = new services\MetricService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;

	$dataColumn = Params::GetMandatory('c');
	if ($dataColumn === 'O') {
		$dataColumnId = Params::GetIntMandatory('ci');
	} else {
		$dataColumnId = null;
	}
	$normalizationColumn = Params::Get('o');
	if ($normalizationColumn === 'O') {
		$normalizationColumnId = Params::GetIntMandatory('oi');
	} else {
		$normalizationColumnId = null;
	}
	if ($normalizationColumn)
		$normalizationScale = Params::GetMandatory('s');
	else
		$normalizationScale = Params::Get('s');

	return App::Json($controller->GetColumnDistributions($datasetId, $dataColumn, $dataColumnId, $normalizationColumn, $normalizationColumnId, $normalizationScale));
});

App::Get('/services/backoffice/GetColumnStringDistributions', function (Request $request) {
	$controller = new services\MetricService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;

	$cutColumnId = Params::GetIntMandatory('c');

	return App::Json($controller->GetColumnStringDistributions($datasetId, $cutColumnId));
});

App::GetOrPost('/services/backoffice/UpdateMetricVersionLevel', function (Request $request) {
	$controller = new services\MetricService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$param = Params::GetJsonMandatory('l');
	$level = App::ReconnectJsonParam(entities\DraftMetricVersionLevel::class, 'l');

	return App::Json($controller->UpdateMetricVersionLevel($datasetId, $level));
});

App::Post('/services/backoffice/ClipboardCopy', function (Request $request) {
	$text = Params::GetMandatory('t');
	PhpSession::SetSessionValue('clipboard', $text);
	return "OK";
});

App::Get('/services/backoffice/ClipboardPaste', function (Request $request) {
	$text = PhpSession::GetSessionValue('clipboard', null);
	return App::Json(array('text' => $text));
});

App::Get('/services/backoffice/MoveVariableUp', function (Request $request) {
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$controller = new services\MetricService();
	$variableId = Params::GetIntMandatory('v');
	return App::Json($controller->MoveVariableUp($datasetId, $variableId));
});

App::Get('/services/backoffice/MoveVariableDown', function (Request $request) {
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$controller = new services\MetricService();
	$variableId = Params::GetIntMandatory('v');
	return App::Json($controller->MoveVariableDown($datasetId, $variableId));
});

App::GetOrPost('/services/backoffice/DeleteVariable', function (Request $request) {
	$controller = new services\MetricService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$variableId = Params::GetIntMandatory('v');
	$levelId = Params::GetIntMandatory('l');

	return App::Json($controller->DeleteVariable($datasetId, $levelId, $variableId));
});

App::GetOrPost('/services/backoffice/DeleteMetricVersionLevel', function (Request $request) {
	$controller = new services\MetricService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$levelId = Params::GetIntMandatory('l');

	return App::Json($controller->DeleteMetricVersionLevel($datasetId, $levelId));
});

App::GetOrPost('/services/backoffice/UpdateVariable', function (Request $request) {
	$controller = new services\MetricService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;

	$variable = Params::GetJsonMandatory('v');
	$level = App::ReconnectJsonParam(entities\DraftMetricVersionLevel::class, 'l');

	return App::Json($controller->UpdateVariable($datasetId, $level, $variable));
});

App::GetOrPost('/services/backoffice/CalculateNewMetric', function (Request $request) {
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId))
		return $denied;

	$type = Params::Get('t');
	$source = Params::GetJson('s', true);
	$output = Params::GetJson('o', true);

	if($type == 'distance')
	{
		$controller = new services\CalculatedDistanceService();
		return App::Json($controller->StartCalculate($datasetId, $source, $output));
	}
	//elseif($type == 'area')
	// $area = Params::GetJson('a', true);
	return App::Json(['error' => 1, 'msg' => 'No implementado']);
});

App::GetOrPost('/services/backoffice/StepCalculateNewMetric', function (Request $request) {
	$controller = new services\CalculatedDistanceService();
	$key = Params::GetMandatory('k');
	return App::Json($controller->StepCalculate($key));
});

App::GetOrPost('/services/backoffice/CalculatedMetricExists', function (Request $request) {
	$controller = new services\metrics\MetricsCalculator();
	$datasetId = Params::GetIntMandatory('k');
	$variableId = Params::GetInt('v');

	if ($denied = Session::CheckIsDatasetEditor($datasetId))
		return $denied;

	return App::Json(['columnExists' => $controller->DistanceColumnExists($datasetId, $variableId)]);
});
