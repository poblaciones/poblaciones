<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;

use helena\classes\Session;
use helena\services\backoffice as services;
use minga\framework\Params;
use minga\framework\ErrorException;
use helena\entities\backoffice as entities;


// ******* Dataset *********************************


App::$app->get('/services/backoffice/DeleteDatasetColumns', function (Request $request) {
	$controller = new services\DatasetColumnService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$ids = Params::GetJsonMandatory('ids');
	return App::Json($controller->DeleteColumns($datasetId, $ids));
});

App::$app->get('/services/backoffice/SetColumnOrder', function (Request $request) {
	$controller = new services\DatasetColumnService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$cols = Params::GetJsonMandatory('cols');
	$controller->SetColumnOrder($datasetId, $cols);
	return "OK";
});

App::$app->get('/services/backoffice/GetColumnUniqueValues', function (Request $request) {
	$controller = new services\DatasetColumnService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;
	$columnId = Params::GetIntMandatory('c');
	return App::Json($controller->GetColumnUniqueValues($datasetId, $columnId));
});

App::GetOrPost('/services/backoffice/AutoRecodeValues', function (Request $request) {
	$controller = new services\DatasetColumnService();
	$columnId = Params::GetIntMandatory('c');
	$col = App::Orm()->find(entities\DraftDatasetColumn::class, $columnId);
	$dataset = $col->getDataset();
	if ($denied = Session::CheckIsDatasetEditor($dataset->getId())) return $denied;
	$labels = Params::GetJsonMandatory('i');
	$newName = Params::GetMandatory('n');
	$newLabel = Params::GetMandatory('l');
	return App::Json($controller->AutoRecodeValues($columnId, $labels, $newName, $newLabel));
});


App::Post('/services/backoffice/UpdateLabels', function (Request $request) {
	$controller = new services\DatasetColumnService();
	$columnId = Params::GetIntMandatory('c');
	$col = App::Orm()->find(entities\DraftDatasetColumn::class, $columnId);
	$dataset = $col->getDataset();
	if ($denied = Session::CheckIsDatasetEditor($dataset->getId())) return $denied;
	$labels = Params::GetJsonMandatory('i');
	$deletedLabels = Params::GetJsonMandatory('d');
	return App::Json($controller->UpdateLabels($columnId, $labels, $deletedLabels));
});

App::Post('/services/backoffice/SaveColumn', function (Request $request) {
	$controller = new services\DatasetColumnService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetEditor($datasetId)) return $denied;
	$column = App::ReconnectJsonParamMandatory(entities\DraftDatasetColumn::class, 'c');
	if ($column->getId() > 0) {
		$columnDataset = $column->getDataset();
		if ($columnDataset->getId() !== $datasetId)
			throw new ErrorException('Dataset do not match');
	}
	return App::OrmJson($controller->SaveColumn($datasetId, $column));
});


App::$app->get('/services/backoffice/GetDatasetColumns', function (Request $request) {
	$controller = new services\DatasetColumnService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;
	return App::OrmJson($controller->GetDatasetColumns($datasetId));
});


App::$app->get('/services/backoffice/GetDatasetColumnsLabels', function (Request $request) {
	$controller = new services\DatasetColumnService();
	$datasetId = Params::GetIntMandatory('k');
	if ($denied = Session::CheckIsDatasetReader($datasetId)) return $denied;
	return App::Json($controller->GetDatasetColumnsLabels($datasetId));
});

