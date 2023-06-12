<?php

namespace helena\services\backoffice;

use minga\framework\Params;
use minga\framework\PublicException;
use minga\framework\ErrorException;
use minga\framework\Profiling;
use minga\framework\WebConnection;
use minga\framework\IO;

use helena\classes\App;
use helena\classes\CsvParser;
use helena\caches\DatasetColumnCache;
use helena\services\backoffice\cloning\DatasetClone;
use helena\entities\backoffice as entities;
use helena\services\backoffice\publish\PublishDataTables;
use helena\services\backoffice\publish\WorkFlags;
use helena\services\backoffice\import\DatasetTable;
use helena\caches\BackofficeDownloadCache;
use helena\services\backoffice\import\PhpSpreadSheetCsv;

use PhpOffice\PhpSpreadsheet\IOFactory;

class DatasetService extends DbSession
{
	public function CreateDatasetWithDefaultMetric($workId, $caption = '')
	{
		// Crea el dataset
		$caption = trim($caption);
		$dataset = $this->Create($workId, $caption);

		$this->CreateDefaultMetric($dataset, $caption);
		return $dataset;
	}

	private function CreateDefaultMetric($dataset, $caption)
	{
		// Crea el metric, metricVersion y metricVersionLevel
		$metricService = new MetricService();

		// Crea la variable default
		$variable = $metricService->GetNewVariable();
		$variable->setIsDefault(true);
		$variable->setDataColumnIsCategorical(false);
		$variable->setCaption('Conteo');
		$variable->setData('N');

		$metricService->CreateMetricByVariable($dataset, $caption, $variable);
	}

	public function Create($workId, $caption = '')
	{
		Profiling::BeginTimer();

		$datasetMarker = new entities\DraftDatasetMarker();
		$datasetMarker->setAutoScale(true);
		$datasetMarker->setSize('S');
		$datasetMarker->setFrame('C');
		$datasetMarker->setDescriptionVerticalAlignment('B');
		$datasetMarker->setSource('F');
		if (trim($caption) !== "")
		{
			$datasetMarker->setType('T');
			$letter = mb_strtoupper(mb_substr($caption, 0, 1));
			$datasetMarker->setText($letter);
		}
		else
			$datasetMarker->setType('N');

		App::Orm()->Save($datasetMarker);

		$dataset = new entities\DraftDataset();
		$dataset->setCaption($caption);
		$work = App::Orm()->find(entities\DraftWork::class, $workId);
		$dataset->setMarker($datasetMarker);
		$dataset->setWork($work);
        $dataset->setType('L');
		$dataset->setShowInfo(true);
		$dataset->setSkipEmptyFields(false);
		$dataset->setExportable(true);
		$dataset->setPublicLabels(true);
		$dataset->setPartitionMandatory(true);
		$dataset->setPartitionAllLabel('Todos');
		$dataset->setGeoreferenceStatus(0);
		$dataset->setGeocoded(false);
		$dataset->setAreSegments(false);
		App::Orm()->Save($dataset);
		// Marca work
		DatasetService::DatasetChanged($dataset);
		Profiling::EndTimer();
		return $dataset;
	}
	public static function DatasetChangedById($datasetId, $onlyLabels = false)
	{
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		self::DatasetChanged($dataset, $onlyLabels);
	}
	public static function DatasetChanged($dataset, $onlyLabels = false)
	{
		BackofficeDownloadCache::Clear($dataset->getId());
		if ($onlyLabels)
			WorkFlags::SetDatasetLabelsChanged($dataset->getWork()->getId());
		else
			WorkFlags::SetDatasetDataChanged($dataset->getWork()->getId());
	}
	public function GetDataset($datasetId)
	{
		Profiling::BeginTimer();
		$ret = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		return $ret;
	}

	public function UpdateDataset($dataset, $requiresRegenData = false)
	{
		Profiling::BeginTimer();
		$this->Save(entities\DraftDataset::class, $dataset);
		// Marca work
		DatasetService::DatasetChanged($dataset, !$requiresRegenData);
		Profiling::EndTimer();
		return self::OK;
	}

	public function CreateRow($datasetId)
	{
		Profiling::BeginTimer();
		$dataset = $this->GetDataset($datasetId);
		$table = $dataset->getTable();
		// La crea
		$sql = "INSERT INTO " . $table . " () VALUES ();";
		App::Db()->exec($sql);

		$ret = array('Id' => App::Db()->lastInsertId());

		Profiling::EndTimer();
		return $ret;
	}

	public function OmmitDatasetAllRows($datasetId)
	{
		Profiling::BeginTimer();
		$dataset = $this->GetDataset($datasetId);
		$table = $dataset->getTable();
		// Lo graba
		$ommit = "UPDATE " . $table . " JOIN " . $table . "_errors ON row_id = id SET ommit = 1 WHERE ommit = 0";
		App::Db()->exec($ommit);
		$ret = array('completed' => true, 'affected' => App::Db()->lastRowsAffected());
		$this->DeleteAllErrors($table);
		Profiling::EndTimer();
		return $ret;
	}

	public function OmmitDatasetRows($datasetId, $ids)
	{
		Profiling::BeginTimer();
		$dataset = $this->GetDataset($datasetId);
		$table = $dataset->getTable();
		// Lo graba
		$ommit = "UPDATE " . $table . " SET ommit = 1 WHERE Id IN (" . join(',', $ids) . ")";
		App::Db()->exec($ommit);
		$ret = array('completed' => true, 'affected' => App::Db()->lastRowsAffected());
		$this->DeleteFromErrors($table, $ids);
		Profiling::EndTimer();
		return $ret;
	}

	public function DeleteDatasetRows($datasetId, $ids)
	{
		Profiling::BeginTimer();
		$dataset = $this->GetDataset($datasetId);
		$table = $dataset->getTable();
		// Lo graba
		$delete = "DELETE FROM " . $table . " WHERE Id IN (" . join(',', $ids) . ")";
		App::Db()->exec($delete);
		$ret = array('completed' => true, 'affected' => App::Db()->lastRowsAffected());
		$this->DeleteFromErrors($table, $ids);
		DatasetColumnCache::Cache()->Clear($datasetId);
		// Marca work
		DatasetService::DatasetChanged($dataset);
		Profiling::EndTimer();
		return $ret;
	}
	private function DeleteAllErrors($table)
	{
		$tableErrors = $table . "_errors";
		if (App::Db()->tableExists($tableErrors) == false)
			return;

		$errors = "DELETE FROM " . $tableErrors;
		App::Db()->exec($errors);
	}
	private function DeleteFromErrors($table, $ids)
	{
		$tableErrors = $table . "_errors";
		if (App::Db()->tableExists($tableErrors) == false)
			return;

		$errors = "DELETE FROM " . $tableErrors . " WHERE row_id IN (" . join(',', $ids) . ")";
		App::Db()->exec($errors);
	}

	public function ConvertCsvLabelsFile($data)
	{
		$outFile = $this->Base64ToFile($data);
	  $data = $this->CsvToJson($outFile);
		IO::Delete($outFile);
		return $data;
	}

	private function Base64ToFile($data)
	{
		$SEP = ";base64,";
		$n = strpos($data, $SEP);
		$outFile = IO::GetTempFilename();
		IO::WriteAllText($outFile, base64_decode(substr($data, $n + strlen($SEP))));
		return $outFile;
	}

	private function CsvToJson($outFile)
	{
		$csv = new CsvParser();
		// abre el archivo.
		$csv->Open($outFile);
		// obtiene el header.
		$csv->GetHeader();
		$data = [];
		while($csv->eof == false)
		{
			 // obtiene el texto por columnas.
			 $rows = $csv->GetNextRowsByRow(10000);
			 foreach($rows as $row)
			 {
				 if (sizeof($row) > 1)
	 				 $data[] = ['Value' => $row[0], 'Caption' => $row[1]];
			 }
		}
		$csv->Close();
		return $data;
	}

	public function ConvertExcelLabelsFile($data)
	{
		$excelFile = $this->Base64ToFile($data);
		$outFile = IO::GetTempFilename();

		// Converte el excel a CSV
		$spreadsheet = IOFactory::load($excelFile);
		$writer = new PhpSpreadSheetCsv($spreadsheet);
		$writer->setSheetIndex(0);
		$writer->save($outFile);

		// Lo lee
	  $data = $this->CsvToJson($outFile);

		// Sale
		IO::Delete($excelFile);
		IO::Delete($outFile);

		return $data;
	}

	public function UpdateRowValues($datasetId, $id, $values)
	{
		Profiling::BeginTimer();
		$dataset = $this->GetDataset($datasetId);
		$table = $dataset->getTable();

		// Lo graba
		$fields = "modified = 1";
		$params = array();
		foreach($values as $fieldInfo)
		{
				$fields .= ", ";
				$field = $this->GetFieldFromColumn($datasetId, $fieldInfo->columnId);
				$fields .= $field . " = ? ";
				$params[] = $fieldInfo->value;
		}
		$update = "UPDATE " . $table . " SET " . $fields . " WHERE Id = ?";
		$params[] = $id;
		App::Db()->exec($update, $params);

		DatasetColumnCache::Cache()->Clear($datasetId);
		// Marca work
		DatasetService::DatasetChanged($dataset);
		Profiling::EndTimer();
		return self::OK;
	}

	public function UpdateMultilevelMatrix($dataset1Id, $matrix1, $dataset2Id, $matrix2)
	{
		$sql = "UPDATE draft_dataset SET dat_multilevel_matrix = ? WHERE dat_id = ?";
		App::Db()->exec($sql, array(($matrix1 == 0 ? null : $matrix1), $dataset1Id));
		App::Db()->exec($sql, array(($matrix2 == 0 ? null : $matrix2), $dataset2Id));
	}
	public function GetDatasetData($datasetId, $from, $rows)
	{
		return $this->GetDatasetRows($datasetId, $from, $rows);
	}

	public function GetDatasetErrors($datasetId, $from, $rows)
	{
		return $this->GetDatasetRows($datasetId, $from, $rows, true);
	}


	public function GetGridExport($filename, &$format, $content)
	{
		$wc = new WebConnection();
		$wc->Initialize();

		$uri = "http://jquerygrid.net/export_server/dataexport.php";
		$ret = $wc->Post($uri, '', ['filename' => $filename, 'format' => $format, 'content' => $content]);
		if ($ret->error)
		{
			throw new ErrorException("No se pudo realizar la exportación: " . $ret->error);
		}
		$wc->Finalize();
		if ($format === "xls")
		{
			$format = "xlsx";
			return $this->ConvertXmlToXlsx($ret->file);
		}
		else
			return $ret->file;
	}

	private function ConvertXmlToXlsx($file)
	{
		$reader = new \PhpOffice\PhpSpreadsheet\Reader\Xml();
		$spreadsheet = $reader->load($file);
		$writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
		$temp = IO::GetTempFilename();
		$writer->save($temp);
		IO::Delete($file);
		return $temp;
	}

	private function GetDatasetRows($datasetId, $from, $rows, $showErrors = false)
	{
		Profiling::BeginTimer();
		// Trae metadatos
		$dataset = $this->GetDataset($datasetId);
		$cols = new DatasetColumnService();
		$columns = $cols->GetDatasetColumns($datasetId);
		if ( $dataset->getTable() == "" || sizeof($columns) === 0)
		{
				return array(
				 'TotalRows' => 0,
				 'Data' => array());
		}
		$orderby = $this->resolveJqxGridOrderBy($datasetId);
		$filters = $this->resolveJqxGridFilters($datasetId);

		$ret = array();
		$cols = "";
		foreach($columns as $column)
			$cols .= ',' . $column->getField() . ' `' . $column->getVariable() . '`';
		$cols .= ',Id as internal__Id';

		// Si es la vista de errores desde georreferenciación, hace join con la tabla de errors
		$joinErrors = '';
		$whereErrors = '';
		$colsErrors = '';
		if ($showErrors) {
			$colsErrors = "GeoreferenceErrorWithCode(error_code) as internal__Err,";
			$joinErrors = " JOIN " . $dataset->getTable() . "_errors ON row_id = id ";
			$whereErrors = " AND ommit = 0 ";
		}

		// Trae los datos
		$query = "SELECT SQL_CALC_FOUND_ROWS " . $colsErrors . substr($cols, 1) . " FROM " . $dataset->getTable() . $joinErrors .
								" WHERE 1 " . $whereErrors . $filters . $orderby . " LIMIT " . $from . ", " . $rows;
		$data = App::Db()->fetchAllByPos($query);
		$sql = "SELECT FOUND_ROWS()";
		$rowcount = App::Db()->fetchScalarInt($sql);

		// Listo
		$ret = array(
       'TotalRows' => $rowcount,
		   'Data' => $data
		);
		Profiling::EndTimer();

		return $ret;
	}

	private function resolveJqxGridFilters($datasetId)
	{
		$where = "";
		$filterscount = intval(Params::GetInt('filterscount', 0));
		if ($filterscount === 0) return '';

		$where = "";
		$tmpdatafield = "";
		$tmpfilteroperator = "";

		for ($i=0; $i < $filterscount; $i++)
		{
			$filtervalue = Params::Get("filtervalue" . $i);
			$filtercondition = Params::Get("filtercondition" . $i);
			$filtervariable = Params::Get("filterdatafield" . $i);
			$filteroperator = Params::Get("filteroperator" . $i);
			if ($filtervariable === 'internal__Err')
				$filterdatafield = 'GeoreferenceErrorWithCode(error_code)';
			else
				$filterdatafield = $this->GetFieldFromVariable($datasetId, $filtervariable);

			if ($filterdatafield !== null)
			{
				$this->AddFilterToQuery($tmpdatafield, $tmpfilteroperator, $where,
						$filtervalue, $filtercondition, $filtervariable, $filteroperator, $filterdatafield);
			}
		}
		$where .= ")";

		if ($where === "()" || $where === ")")
			$where = "";
		else if ($where !== "")
			$where = "AND (" . $where . ")";

		return $where;
	}

	private function AddFilterToQuery(&$tmpdatafield, &$tmpfilteroperator, &$where,
					$filtervalue, $filtercondition, $filtervariable, $filteroperator, $filterdatafield)
	{
		if ($tmpdatafield === '')
		{
			$tmpdatafield = $filterdatafield;
			$where .= "(";
		}
		else if ($tmpdatafield !== $filterdatafield)
		{
			$where .= ") AND (";
		}
		else if ($tmpdatafield === $filterdatafield)
		{
			if ($tmpfilteroperator === "0")
				$where .= " AND ";
			else
				$where .= " OR ";
		}
		else $where .= "(";

		// build the "WHERE" clause depending on the filter's condition, value and datafield.
		switch($filtercondition)
		{
			case "CONTAINS":
				$where .= " " . $filterdatafield . " LIKE '%" . $filtervalue . "%'";
				break;
			case "CONTAINS_CASE_SENSITIVE":
				$where .= " " . $filterdatafield . " LIKE BINARY '%" . $filtervalue . "%'";
				break;
			case "DOES_NOT_CONTAIN":
				$where .= " " . $filterdatafield . " NOT LIKE '%" . $filtervalue . "%'";
				break;
			case "DOES_NOT_CONTAIN_CASE_SENSITIVE":
				$where .= " " . $filterdatafield . " NOT LIKE BINARY '%" . $filtervalue . "%'";
				break;
			case "EQUAL":
				$where .= " " . $filterdatafield . " = '" . $filtervalue . "'";
				break;
			case "EQUAL_CASE_SENSITIVE":
				$where .= " " . $filterdatafield . " LIKE BINARY '" . $filtervalue . "'";
				break;
			case "NOT_EQUAL":
				$where .= " " . $filterdatafield . " NOT LIKE '" . $filtervalue . "'";
				break;
			case "NOT_EQUAL_CASE_SENSITIVE":
				$where .= " " . $filterdatafield . " NOT LIKE BINARY '" . $filtervalue . "'";
				break;
			case "GREATER_THAN":
				$where .= " " . $filterdatafield . " > '" . $filtervalue . "'";
				break;
			case "LESS_THAN":
				$where .= " " . $filterdatafield . " < '" . $filtervalue . "'";
				break;
			case "GREATER_THAN_OR_EQUAL":
				$where .= " " . $filterdatafield . " >= '" . $filtervalue . "'";
				break;
			case "LESS_THAN_OR_EQUAL":
				$where .= " " . $filterdatafield . " <= '" . $filtervalue . "'";
				break;
			case "STARTS_WITH":
				$where .= " " . $filterdatafield . " LIKE '" . $filtervalue . "%'";
				break;
			case "STARTS_WITH_CASE_SENSITIVE":
				$where .= " " . $filterdatafield . " LIKE BINARY '" . $filtervalue . "%'";
				break;
			case "ENDS_WITH":
				$where .= " " . $filterdatafield . " LIKE '%" . $filtervalue . "'";
				break;
			case "ENDS_WITH_CASE_SENSITIVE":
				$where .= " " . $filterdatafield . " LIKE BINARY '%" . $filtervalue . "'";
				break;
			case "NULL":
				$where .= " " . $filterdatafield . " IS NULL";
				break;
			case "NOT_NULL":
				$where .= " " . $filterdatafield . " IS NOT NULL";
				break;
		}
		$tmpfilteroperator = $filteroperator;
		$tmpdatafield = $filterdatafield;
	}

	private function resolveJqxGridOrderBy($datasetId)
	{
		$sortvariable = Params::Get("sortdatafield");
		if ($sortvariable === null) return "";
		if ($sortvariable === 'internal__Err')
		{
			$sortdatafield = 'error_code';
		} else {
			$sortdatafield = $this->GetFieldFromVariable($datasetId, $sortvariable);
			if ($sortdatafield === null)
				return "";
		}
		$sortorder = Params::Get("sortorder", 'asc');
		if ($sortorder !== "asc" && $sortorder !== "desc")
			$sortorder = 'asc';
		return " ORDER BY " . $sortdatafield . " " . $sortorder;
	}

	private function GetFieldFromVariable($datasetId, $variable)
	{
		if ($variable === 'internal__Id')
			return 'Id';
		Profiling::BeginTimer();
		// Obtiene el campo para la variable
		$params = array($datasetId, $variable);
		$sql = "SELECT dco_field FROM draft_dataset_column where dco_dataset_id = ? and dco_variable = ? LIMIT 1";
		$ret = App::Db()->fetchScalarNullable($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	private function GetFieldFromColumn($datasetId, $columnId)
	{
		Profiling::BeginTimer();
		// Obtiene el campo para la variable
		$params = array($datasetId, $columnId);
		$sql = "SELECT dco_field FROM draft_dataset_column where dco_dataset_id = ? and dco_id = ? LIMIT 1";
		$ret = App::Db()->fetchScalar($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	public function CloneDataset($workId, $newName, $datasetId)
	{
		Profiling::BeginTimer();
		// Marca work
		WorkFlags::SetDatasetDataChanged($workId);

		$cloner = new DatasetClone($workId, $newName, $datasetId);
		$ret = $cloner->CloneDataset();
		Profiling::EndTimer();
		return $ret;
	}
	public function DeleteDataset($workId, $datasetId)
	{
		Profiling::BeginTimer();
		// Marca work
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		if ($dataset === null)
			throw new PublicException("Dataset no encontrado.");
		DatasetService::DatasetChanged($dataset);

		$multilevelMatrix = $dataset->getMultilevelMatrix();
		$matrixCount = $this->resolveMatrixMembersCount($workId, $dataset);

		$columnsReferences = new PublishDataTables();
		$columnsReferences->UnlockColumns($workId, true, $datasetId);
		// Borra indicadores
		$this->DeleteMetricVersionLevels($datasetId);
		// Borra valueLabels
		$deleteLabels = "DELETE FROM draft_dataset_column_value_label
											WHERE dla_dataset_column_id IN (SELECT dco_id FROM draft_dataset_column WHERE dco_dataset_id = ?)";
		App::Db()->exec($deleteLabels, array($datasetId));
		// Borra columnas
		$deleteCols = "DELETE FROM draft_dataset_column WHERE dco_dataset_id = ?";
		App::Db()->exec($deleteCols, array($datasetId));
		// Guardar el marker
		$marker = $dataset->getMarker();
		if ($marker)
			$markerId = $marker->getId();
		else
			$markerId = null;
		// Borra dataset
		App::Orm()->delete($dataset);
		// Borrar marker_info asociado
		if ($markerId)
		{
			$deleteMarker = "DELETE FROM draft_dataset_marker WHERE dmk_id = ?";
			App::Db()->exec($deleteMarker, array($markerId));
		}
		// Borra tablas
		$tableName = $dataset->getTable();
		if ($tableName)
		{
			App::Db()->dropTable($tableName);
			App::Db()->dropTable($tableName . '_errors');
			App::Db()->dropTable($tableName . '_retry');
		}
		$unregister = new DatasetTable();
		$unregister->UnregisterTable($tableName);
		// Libera al par de la multilevelMatrix si lo formaban dos miembros
		if ($matrixCount === 2)
		{
				$query = "UPDATE draft_dataset SET dat_multilevel_matrix = NULL WHERE dat_work_id = ? AND dat_multilevel_matrix = ?";
				App::Db()->exec($query, array($workId, $multilevelMatrix));
		}
		DatasetColumnCache::Cache()->Clear($datasetId);
		Profiling::EndTimer();
	}

	private function DeleteMetricVersionLevels($datasetId)
	{
		Profiling::BeginTimer();
		$metricVersionLevels = App::Orm()->findManyByQuery("SELECT v FROM e:DraftMetricVersionLevel v JOIN v.Dataset d WHERE d.Id = :p1", array($datasetId));
		foreach($metricVersionLevels as $metricVersionLevel)
			$this->DeleteMetricVersionLevel($metricVersionLevel);
		Profiling::EndTimer();
	}

	private function resolveMatrixMembersCount($workId, $dataset)
	{
		$multilevelMatrix = $dataset->getMultilevelMatrix();
		if ($multilevelMatrix === null)
			return 0;

		$query = "SELECT COUNT(*) FROM draft_dataset WHERE dat_work_id = ? AND dat_multilevel_matrix = ?";
		return App::Db()->fetchScalarInt($query, array($workId, $multilevelMatrix));
	}

	private function DeleteMetricVersionLevel($metricVersionLevel)
	{
		Profiling::BeginTimer();
		$metricVersion = $metricVersionLevel->getMetricVersion();
		$metric = $metricVersion->getMetric();
		// Borra las variables
		$this->DeleteVariables($metricVersionLevel);

		// Borra el metric version level
		App::Orm()->delete($metricVersionLevel);
		$this->DeleteOrphanMetricVersion($metricVersion);

		// Borra los metric sin verisones
		$this->DeleteOrphanMetric($metric);
		Profiling::EndTimer();
	}

	private function DeleteVariables($metricVersionLevel)
	{
		Profiling::BeginTimer();
		$metricVersionLevelId = $metricVersionLevel->getId();

		$variables = "draft_variable WHERE mvv_metric_version_level_id = ?";
		// Borra los valueLabels
		$deleteVariableValueLabel = "DELETE FROM draft_variable_value_label WHERE vvl_variable_id IN (SELECT mvv_id FROM " . $variables . ")";
    App::Db()->exec($deleteVariableValueLabel, array($metricVersionLevelId));
		// Borra las variables guardándose los symbologies
		$symbologiesSql = "SELECT mvv_symbology_id FROM " . $variables;
		$symbologies = App::Db()->fetchAll($symbologiesSql, array($metricVersionLevelId));
    $deleteMetricVersionVariable = "DELETE FROM " . $variables;
    App::Db()->exec($deleteMetricVersionVariable, array($metricVersionLevelId));
		// Borra los symbologies
		if (count($symbologies) > 0)
		{
			$symIds = [];
			foreach($symbologies as $row)
				$symIds[] = $row['mvv_symbology_id'];
			$ids = implode("," , $symIds);
			App::Db()->exec("DELETE FROM draft_symbology WHERE vsy_id IN (" . $ids . ") AND NOT EXISTS(
									SELECT * FROM draft_variable WHERE mvv_symbology_id IN (" . $ids ."))");
		}
		Profiling::EndTimer();
	}
	private function DeleteOrphanMetricVersion($metricVersion)
	{
		Profiling::BeginTimer();
		// Se fija si era el último
		$childrenSql = "SELECT count(*) FROM draft_metric_version_level WHERE mvl_metric_version_id = ?";
		$sibilings = App::Db()->fetchScalarInt($childrenSql, array($metricVersion->getId()));
		if ($sibilings == 0)
		{
			App::Orm()->delete($metricVersion);
		}
		Profiling::EndTimer();
	}
	private function DeleteOrphanMetric($metric)
	{
		Profiling::BeginTimer();
		// Se fija si era el último
		$childrenSql = "SELECT count(*) FROM draft_metric_version WHERE mvr_metric_id = ?";
		$sibilings = App::Db()->fetchScalarInt($childrenSql, array($metric->getId()));
		if ($sibilings == 0)
		{
			// Borra sus usos como extra metric
			App::Db()->exec("DELETE FROM draft_work_extra_metric WHERE wmt_metric_id = ?", array($metric->getId()));
			// Lo borra
			App::Orm()->delete($metric);
		}
		Profiling::EndTimer();
	}
}