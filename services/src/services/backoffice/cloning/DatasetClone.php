<?php

namespace helena\services\backoffice\cloning;

use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\services\backoffice\publish\WorkFlags;
use minga\framework\PublicException;
use helena\services\backoffice\import\MetadataMerger;
use minga\framework\Arr;
use minga\framework\Str;
use helena\services\backoffice\WorkService;
use helena\services\backoffice\import\DatasetTable;

class DatasetClone
{
	private	$sourceDatasetId;

	private	$targetDatasetId;
	private	$targetTable = null;
	private	$dataset;
	private	$workId;
	private $targetWorkId;
	private	$newName;

	public function __construct($workId, $newName, $sourceDatasetId, $targetWorkId = null)
	{
		$this->workId = $workId;
		$this->sourceDatasetId = $sourceDatasetId;
		if ($targetWorkId !== null)
		{
			$this->targetWorkId = $targetWorkId;
		}
		else
		{
			$this->targetWorkId = $workId;
		}
		$this->newName = $newName;
	}
	public function CloneDataset()
	{
		$keepOldMetadata = true;
		$dropSourceDataset = false;
		$maxPreviousId = 0; // App::Db()->fetchScalarIntNullable("SELECT max(dco_id) FROM draft_dataset_column");

		$this->dataset = App::Orm()->find(entities\DraftDataset::class, $this->sourceDatasetId);
		if ($this->dataset === null)
			throw new PublicException('Dataset no encontrado');
		// 1. Crea tabla de datos (esto no transacciona por ser DDL)
		$this->CopyWorkDatasetTables();

		// 2. Crea el dataset y las columnas
		$this->doCreateNewDataset($this->newName);
		// 2. Copia datasetMarker
		$this->CopyMarkerInfo();
		// 3. Copia indicadores
		$this->CopyMetricVersions();
		// 4. Repara las referencias a columnas
		// en dataset y en indicadores
		$merger = new MetadataMerger($this->sourceDatasetId, $this->targetDatasetId, $keepOldMetadata,
										$maxPreviousId, $dropSourceDataset);
		$merger->MergeMetadata();

		// 4b. Verifica la consistencia interna
		$workService = new WorkService();
		$res = $workService->CheckWorkConsistency($this->targetWorkId);
		if ($res['status'] !== 'OK') {
			throw new \Exception('Ocurrieron problemas de consistencia: ' . $res['errors']);
		}

		// 5. Toca work
		WorkFlags::SetMetricDataChanged($this->workId);
		WorkFlags::SetDatasetDataChanged($this->workId);
		// 6. La saca de temporal
		$datasetTable = new DatasetTable();
		if ($this->targetTable) {
			$datasetTable->PromoteFromTemp($this->targetTable);
			$this->targetTable = DatasetTable::GetNonTemporaryName($this->targetTable);
			$this->UpdateTargetTable();
		}
		// Listo
		return $this->targetDatasetId;
	}
	private function CopyMarkerInfo()
	{
		// Duplica la fila
		$markerId = RowDuplicator::DuplicateRows(entities\DraftDatasetMarker::class, $this->dataset->getMarker()->getId());
		$update = "UPDATE draft_dataset SET dat_marker_id = ? WHERE dat_id = ?";
		App::Db()->exec($update, array($markerId, $this->targetDatasetId));
		App::Db()->markTableUpdate('draft_dataset');

	}
	private function CopyMetricVersions()
	{
		$sql = "SELECT DISTINCT mvr_id FROM draft_metric_version JOIN draft_metric_version_level ON
							mvl_metric_version_id = mvr_id WHERE mvl_dataset_id = ?";
		$metricVersions = App::Db()->fetchAll($sql, array($this->sourceDatasetId));
		foreach($metricVersions as $metricVersion)
		{
			$metricVersion = App::Orm()->find(entities\DraftMetricVersion::class, $metricVersion['mvr_id']);
			$this->CopyMetricVersion($metricVersion);
		}
	}

	private function CopyMetricVersion($metricVersion)
	{
		$metricVersionId = $metricVersion->getId();
		// Copia encabezado
		$name = $metricVersion->getCaption();
		$newName = RowDuplicator::ResolveNewName($name, 'draft_metric_version', $metricVersion->getMetric()->getId(), 'mvr_metric_id', 'mvr_caption', true, 20);
		$static = array('mvr_work_id' => $this->targetWorkId, 'mvr_caption' => $newName);
		$targetMetricVersionId = RowDuplicator::DuplicateRows(entities\DraftMetricVersion::class, $metricVersionId, $static);

		$levelsSql = "SELECT mvl_id FROM draft_metric_version_level WHERE mvl_metric_version_id = ? AND mvl_dataset_id = ?";
		$levels = App::Db()->fetchAll($levelsSql, array($metricVersionId, $this->sourceDatasetId));
		foreach($levels as $level)
		{
			// Copia levels
			$static = array('mvl_metric_version_id' => $targetMetricVersionId, 'mvl_dataset_id' => $this->targetDatasetId);
			$sourceLevelId = $level['mvl_id'];
			$targetLevelId = RowDuplicator::DuplicateRows(entities\DraftMetricVersionLevel::class, $sourceLevelId, $static, 'mvl_id');
			$this->CopyMetricVersionLevel($sourceLevelId, $targetLevelId);
		}
	}
	private function CopyMetricVersionLevel($metricVersionLevelId, $targetMetricVersionLevelId)
	{
		// Trae la lista de variables y copia sus symbologies
		$variablesSql = "SELECT mvv_id, mvv_symbology_id FROM draft_variable WHERE mvv_metric_version_level_id = ?";
		$variables = App::Db()->fetchAll($variablesSql, array($metricVersionLevelId));
		$case = "(CASE ";
		foreach($variables as $variable)
		{
			$sourceSymbologyId = $variable['mvv_symbology_id'];
			$targetSymbologyId = RowDuplicator::DuplicateRows(entities\DraftSymbology::class, $sourceSymbologyId);
			$case .= " WHEN mvv_symbology_id = " . $sourceSymbologyId . " THEN " . $targetSymbologyId;
		}
		$case .= " END)";

		// Copia variables
		if (count($variables) > 0)
		{
			$static = array('mvv_symbology_id' => [$case], 'mvv_metric_version_level_id' => $targetMetricVersionLevelId);
			RowDuplicator::DuplicateRows(entities\DraftVariable::class, $metricVersionLevelId, $static, 'mvv_metric_version_level_id');

			// Copia variableValueLabel
			$parentInfo = array(entities\DraftVariable::class,
										$metricVersionLevelId,
										$targetMetricVersionLevelId,
										'mvv_metric_version_level_id', 'vvl_variable_id');
			RowDuplicator::DuplicateParentedRows($parentInfo, entities\DraftVariableValueLabel::class);
		}
	}

	private function GetTargetVersionByCaption($newName, $targetWorkId)
	{
		$sql = "SELECT mvr_id FROM draft_metric_version JOIN draft_metric_version_level ON
							mvl_metric_version_id = mvr_id WHERE mvr_caption = ? AND mvr_work_id = ? LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, array($newName, $targetWorkId));
		return $ret;
	}
	private function doCreateNewDataset($newName)
	{
		// Copia encabezado
		if ($newName === null)
			$newName = $this->dataset->getCaption();
		$workId = $this->targetWorkId;
		$newName = RowDuplicator::ResolveNewName($newName, 'draft_dataset', $workId, 'dat_work_id', 'dat_caption', false, 100);
		$static = array('dat_georeference_status' => 0, 'dat_georeference_attributes' => null, 'dat_caption' => $newName);
		$static['dat_work_id'] = $this->targetWorkId;
		$static['dat_table'] = $this->targetTable;
		$this->targetDatasetId = RowDuplicator::DuplicateRows(entities\DraftDataset::class, $this->sourceDatasetId, $static);
		// Copia columnas
		$static = array('dco_dataset_id' => $this->targetDatasetId);
		RowDuplicator::DuplicateRows(entities\DraftDatasetColumn::class, $this->sourceDatasetId, $static, 'dco_dataset_id');
	}

	private function CopyWorkDatasetTables()
	{
		// Resuelve nombres
		$table = $this->dataset->getTable();
		if ($table) {
			$this->targetTable = DatasetTable::CreateNewTemporaryTableName();

			// Copia
			$datasetTable = new DatasetTable();
			$datasetTable->CopyTables($table, $this->targetTable);
		}
	}
	private function UpdateTargetTable()
	{
		// Setea el table
		$table = "UPDATE draft_dataset SET dat_table = ? WHERE dat_id = ?";
		App::Db()->exec($table, array($this->targetTable, $this->targetDatasetId));
		App::Db()->markTableUpdate('draft_dataset');
	}
}

