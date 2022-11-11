<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;

use helena\classes\Session;
use helena\services\backoffice as services;
use minga\framework\Params;
use helena\entities\backoffice as entities;


// ******* Dataset *********************************
App::$app->get('/services/backoffice/CreateDataset', function (Request $request) {
	$controller = new services\DatasetService();
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$title = Params::Get('t');
	$entity = $controller->CreateDatasetWithDefaultMetric($workId, $title);
	return App::OrmJson($entity);
});

App::GetOrPost('/services/backoffice/UpdateDataset', function (Request $request) {
	$controller = new services\DatasetService();
	$Dataset = App::ReconnectJsonParamMandatory(entities\DraftDataset::class, 'd');
	if ($denied = Session::CheckIsDatasetEditor($Dataset->getId())) return $denied;
	return App::Json($controller->UpdateDataset($Dataset));
});

App::GetOrPost('/services/backoffice/UpdateDatasetRegenData', function (Request $request) {
	$controller = new services\DatasetService();
	$Dataset = App::ReconnectJsonParamMandatory(entities\DraftDataset::class, 'd');
	if ($denied = Session::CheckIsDatasetEditor($Dataset->getId())) return $denied;
	return App::Json($controller->UpdateDataset($Dataset, true));
});

App::GetOrPost('/services/backoffice/ConvertCsvLabelsFile', function (Request $request) {
	$controller = new services\DatasetService();
	$DatasetId = Params::GetIntMandatory("k");
	if ($denied = Session::CheckIsDatasetEditor($DatasetId)) return $denied;
	$data = Params::GetMandatory("d");
	return App::Json($controller->ConvertCsvLabelsFile($data));
});

App::GetOrPost('/services/backoffice/ConvertExcelLabelsFile', function (Request $request) {
	$controller = new services\DatasetService();
	$DatasetId = Params::GetIntMandatory("k");
	if ($denied = Session::CheckIsDatasetEditor($DatasetId)) return $denied;
	$data = Params::GetMandatory("d");
	return App::Json($controller->ConvertExcelLabelsFile($data));
});

App::GetOrPost('/services/backoffice/ExportGridService', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkReader($workId)) return $denied;
	$controller = new services\DatasetService();

	$filename = Params::GetMandatory("filename");
	$format = Params::GetMandatory("format");
	$content = Params::GetMandatory("content");

	$file = $controller->GetGridExport($filename, $format, $content);

	return App::StreamFile($file, $filename . "." . $format);
});


App::Get('/services/backoffice/UpdateMultilevelMatrix', function (Request $request) {
	$controller = new services\DatasetService();
	$dataset1Id = Params::GetIntMandatory('d1');
	if ($denied = Session::CheckIsDatasetEditor($dataset1Id)) return $denied;
	$dataset2Id = Params::GetIntMandatory('d2');
	if ($denied = Session::CheckIsDatasetEditor($dataset2Id)) return $denied;
	$matrix1 = Params::GetMandatory('m1');
	$matrix2 = Params::GetMandatory('m2');
	return App::Json($controller->UpdateMultilevelMatrix($dataset1Id, $matrix1, $dataset2Id, $matrix2));
});


App::Get('/services/backoffice/CreateDatasetRow', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	return App::Json($controller->CreateRow($datasetId));
});

App::GetOrPost('/services/backoffice/OmmitDatasetRows', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$ids = Params::GetJsonMandatory('ids');
	return App::Json($controller->OmmitDatasetRows($datasetId, $ids));
});

App::GetOrPost('/services/backoffice/DeleteDatasetRows', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$ids = Params::GetJsonMandatory('ids');
	return App::Json($controller->DeleteDatasetRows($datasetId, $ids));
});

App::GetOrPost('/services/backoffice/UpdateRowValues', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$id = Params::GetIntMandatory('id');
	$values = Params::GetJsonMandatory('v');
	return App::Json($controller->UpdateRowValues($datasetId, $id, $values));
});

App::$app->get('/services/backoffice/StartDatasetDownload', function (Request $request) {
	$controller = new services\DownloadDatasetService();
	$datasetId = Params::GetInt('d');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;
	$type = Params::Get('t');
	return App::Json($controller->CreateMultiRequestFile($type, $datasetId, null, null, null, null));
});

// http://mapas.aacademica.org/services/download/GetDatasetFile?t=ss&l=8&r=1692&a=X
App::$app->get('/services/backoffice/GetDatasetFile', function (Request $request) {
	$datasetId = Params::GetInt('d');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;
	$clippingItemId = null;
	$clippingCircle = null;
	$urbanity = null;
	$type = Params::Get('t');
	return services\DownloadDatasetService::GetFileBytes($type, $datasetId, $clippingItemId, $clippingCircle, $urbanity);
});

App::$app->get('/services/backoffice/StepDatasetDownload', function (Request $request) {
	$controller = new services\DownloadDatasetService();
	$key = Params::Get('k');
	return App::Json($controller->StepMultiRequestFile($key));
});


App::$app->get('/services/backoffice/GetDatasetMetrics', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;
	return App::OrmJson($controller->GetDatasetMetrics($datasetId));
});

App::$app->get('/services/backoffice/GetDatasetData', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;
	$from = Params::GetInt('recordstartindex', 0);
	$to = Params::GetInt('recordendindex', 100);
	$rows = $to - $from;
	return App::Json($controller->GetDatasetData($datasetId, $from, $rows));
});
App::$app->get('/services/backoffice/GetDatasetDataPaged', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;

	$rows = Params::GetInt('pagesize', 100);
	$from = Params::GetInt('page', Params::GetInt('pagenum', 0)) * $rows;
	return App::Json($controller->GetDatasetData($datasetId, $from, $rows));
});

App::$app->get('/services/backoffice/GetDatasetErrors', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;

	$rows = Params::GetInt('pagesize', 100);
	$from = Params::GetInt('page', Params::GetInt('pagenum', 0)) * $rows;
	return App::Json($controller->GetDatasetErrors($datasetId, $from, $rows));
});

App::$app->get('/services/backoffice/GetDataset', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;

	return App::OrmJson($controller->GetDataset($datasetId));
});

// ej. http://mapas/services/backoffice/CloneDataset?w=5&k=24&n=NuevoDataset
App::$app->get('/services/backoffice/CloneDataset', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;

	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;
	$newName = Params::GetMandatory('n');
	$newDatasetId = $controller->CloneDataset($workId, $newName, $datasetId);
	return App::Json(array('datasetId' => $newDatasetId, 'completed' => true));
});


App::$app->get('/services/backoffice/StartCalculatedDistance', function (Request $request) {
	$workId = Params::GetIntMandatory('w');
	if ($denied = Session::CheckIsWorkEditor($workId)) return $denied;

	$controller = new services\CalculatedDistanceService();
	return App::Json($controller->StartCalculate($workId));
});

App::$app->get('/services/backoffice/StepCalculatedDistance', function (Request $request) {
	$controller = new services\CalculatedDistanceService();
	$key = Params::GetMandatory('k');
	return App::Json($controller->StepCalculate($key));
});

// ej. http://mapas/services/backoffice/DeleteDataset?w=5&k=24
App::$app->get('/services/backoffice/DeleteDataset', function (Request $request) {
	$controller = new services\DatasetService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$workId = Params::GetIntMandatory('w');
	$controller->DeleteDataset($workId, $datasetId);
	return App::Json(array('completed' => true));
});
