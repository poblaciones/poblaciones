<?php

namespace helena\services\backoffice\cloning;

use helena\classes\App;
use helena\entities\backoffice as entities;
use helena\services\backoffice\publish\WorkFlags;
use minga\framework\ErrorException;
use helena\services\backoffice\import\MetadataMerger;
use minga\framework\Arr;
use minga\framework\Str;
use helena\services\backoffice\import\DatasetTable;

class DatasetClone
{
	private	$sourceDatasetId;

	private	$targetDatasetId;
	private	$targetTable;
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
		$maxPreviousId = 0;
		$this->dataset = App::Orm()->find(entities\DraftDataset::class, $this->sourceDatasetId);
		if ($this->dataset === null)
			throw new ErrorException('Dataset no encontrado');
		// 1. Crea el dataset y las columnas
		$this->doCreateNewDataset($this->newName);

		// 2. Crea tabla de datos
		$this->CopyWorkDatasetTables();

		// 3. Copia indicadores
		$this->CopyMetricVersions();

		// 4. Repara las referencias a columnas
		// en dataset y en indicadores
		$merger = new MetadataMerger($this->sourceDatasetId, $this->targetDatasetId, $keepOldMetadata,
										$maxPreviousId, $dropSourceDataset);
		$merger->MergeMetadata();

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
		
		// Copia levels
		$static = array('mvl_metric_version_id' => $targetMetricVersionId, 'mvl_dataset_id' => $this->targetDatasetId);
		RowDuplicator::DuplicateRows(entities\DraftMetricVersionLevel::class, $metricVersionId, $static, 'mvl_metric_version_id');
		// Copia symbology
		$static = array();
		RowDuplicator::DuplicateRows(entities\DraftSymbology::class,
											"(SELECT mvv_symbology_id FROM draft_variable
												JOIN draft_metric_version_level ON mvv_metric_version_level_id = mvl_id
												WHERE mvl_metric_version_id = " . $metricVersionId . ")", $static, 'vsy_id IN');

		// Calcula el enganche con symbology
		$metadata = App::Orm()->getClassMetadata(entities\DraftSymbology::class);
		$table = $metadata->GetTableName();
		$symbologyQuery = RowDuplicator::CreatePairingQuery($table, $metricVersionId, $targetMetricVersionId,
																								"(SELECT mvl_metric_version_id FROM draft_metric_version_level
																									JOIN draft_variable ON mvv_metric_version_level_id = mvl_id)",
																									'vsy_id', 'mvv_symbology_id');
		// Copia variables
		$static = array('mvv_symbology_id' => $symbologyQuery);
		$parentInfo = array(entities\DraftMetricVersionLevel::class, $metricVersionId,
													$targetMetricVersionId, 'mvl_metric_version_id', 'mvv_metric_version_level_id');
		RowDuplicator::DuplicateParentedRows($parentInfo, entities\DraftVariable::class);
		
		// Copia variableValueLabel
		$parentInfo = array(entities\DraftVariable::class,
									"(SELECT mvl_id FROM draft_metric_version_level WHERE mvl_metric_version_id = " . $metricVersionId . ")",
									"(SELECT mvl_id FROM draft_metric_version_level WHERE mvl_metric_version_id = " . $targetMetricVersionId . ")",
										'mvv_metric_version_level_id IN', 'vvl_variable_id');
		RowDuplicator::DuplicateParentedRows($parentInfo, entities\DraftVariableValueLabel::class);
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
			$this->targetTable = DatasetTable::CreateNewTableName();

			// Copia
			$datasetTable = new DatasetTable();
			$datasetTable->CopyTables($table, $this->targetTable);
			// Setea el table
			$this->UpdateTargetTable();
		}
	}
	private function UpdateTargetTable()
	{
		// Setea el table
		$table = "UPDATE draft_dataset SET dat_table = ? WHERE dat_id = ?";
		App::Db()->exec($table, array($this->targetTable, $this->targetDatasetId));
	}
}

