<?php

namespace helena\services\backoffice;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\PublicException;
use minga\framework\Profiling;

use helena\caches\BackofficeDownloadCache;
use helena\caches\DatasetColumnCache;
use helena\classes\App;
use helena\classes\spss\Alignment;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;
use helena\entities\backoffice as entities;
use helena\services\backoffice\cloning\SqlBuilder;
use helena\services\backoffice\import\DatasetColumns;
use helena\services\backoffice\import\DatasetTable;

class DatasetColumnService extends DbSession
{
	public function GetNewColumn()
	{
		$column = new entities\DraftDatasetColumn();
		$column->setColumnWidth(8);
		$column->setFieldWidth(8);
		$column->setDecimals(0);
		$column->setFormat(Format::F); // numérico
		$column->setMeasure(Measurement::Scale);
		$column->setAlignment(Alignment::Right);
		$column->setUseInSummary(true);
		$column->setUseInExport(true);
		$column->setValueLabelsAreDirty(false);
		return $column;
	}

	public function SaveColumn($datasetId, $column)
	{
		Profiling::BeginTimer();
		// Trae el ancho de la columna
		$fieldWidthSql = "SELECT dco_field_width FROM
																		draft_dataset_column WHERE dco_id = ? AND dco_dataset_id = ?";
		$fieldWidth = App::Db()->fetchScalarInt($fieldWidthSql, array($column->getId(), $datasetId));
		// Graba
		DatasetColumns::FixCaption($column);
		DatasetColumns::FixName($column);
		$duplicated = "SELECT COUNT(*) FROM draft_dataset_column WHERE dco_variable = ? AND dco_id != ? AND dco_dataset_id = ?";
		$count = App::Db()->fetchScalarInt($duplicated, array($column->getVariable(), $column->getId(), $datasetId));

		if ($count > 0)
		{
			throw new PublicException("Ya existe una columna con ese nombre.");
		}
		App::Orm()->save($column);
		// Marca work
		DatasetService::DatasetChangedById($datasetId, true);
		// Si los anchos difieren, cambia la columna en la base de datos
		if ($fieldWidth !== $column->getFieldWidth())
		{
			$this->resizeColumn($datasetId, $column);
			DatasetService::DatasetChangedById($datasetId);
		}
		Profiling::EndTimer();
		return $column;
	}

	private function resizeColumn($datasetId, $column)
	{
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$table = $dataset->getTable();
		$newSize = $column->getFieldWidth();
		$field = $column->getField();
		$type = $column->getFormat();
		if ($type !== Format::A)
			throw new PublicException("No es posible cambiar el tamaño de un campo numérico");
		// Reduce tamaños
		$sqlFixLengths = "UPDATE " . $table . " SET " . $field . " = LEFT(" . $field . ", " . $newSize . ") WHERE
																		LENGTH(" . $field . ") > " . $newSize;
		App::Db()->exec($sqlFixLengths);
		// Cambia el campo
		$sqlAlter = "ALTER TABLE " . $table . " MODIFY " . $field . " VARCHAR(" . $newSize . ")";
		App::Db()->execDDL($sqlAlter);

		App::Db()->markTableUpdate($table);
	}

	public function DeleteColumns($datasetId, $ids)
	{
		Profiling::BeginTimer();
		$datasetService = new DatasetService();
		$dataset = $datasetService->GetDataset($datasetId);
		DatasetService::DatasetChanged($dataset, true);
		BackofficeDownloadCache::Clear($datasetId);

		$deleteData = $this->CreateDropFields($dataset, $ids);

		// Quita referencias hacia estas columnas
		$this->UnlockColumns($datasetId, $ids);
		// Borra los valueLabels
		$labels = "DELETE draft_dataset_column_value_label FROM draft_dataset_column_value_label
									JOIN draft_dataset_column ON dla_dataset_column_id = dco_id
					WHERE dco_dataset_id = ? AND dla_dataset_column_id IN (" . join(',', $ids) . ")";
		App::Db()->exec($labels, array($datasetId));
		App::Db()->markTableUpdate('draft_dataset_column_value_label');

		// Borra las columnas
		$columns = "DELETE FROM draft_dataset_column WHERE dco_dataset_id = ? AND dco_id IN (" . join(',', $ids) . ")";
		App::Db()->exec($columns, array($datasetId));
		App::Db()->markTableUpdate('draft_dataset_column');

		// Ejecuta el drop de los datos
		App::Db()->execDDL($deleteData);
		$table = $dataset->getTable();
		App::Db()->markTableUpdate($table);

		$ret = array('completed' => true, 'affected' => App::Db()->lastRowsAffected());
		DatasetColumnCache::Cache()->Clear($datasetId);

		// Marca work
		DatasetService::DatasetChangedById($datasetId);

		Profiling::EndTimer();
		return $ret;
	}

	private function CreateDropFields($dataset, $ids)
	{
		$table = $dataset->getTable();
		// Hace el query de alter table en los datos
		$delete = "ALTER TABLE " . $table;
		$columns = "";
		$datasetId = $dataset->getId();
		foreach($ids as $id)
		{
			$field = $this->GetFieldFromId($datasetId, $id);
			$columns .= ", DROP COLUMN " . $field;
		}
		return $delete . substr($columns, 1);
	}

	private function conditionalResetter($field, $colsId)
	{
		return $field . " = (CASE WHEN " . $field . " IN (" . join(',', $colsId) . ") THEN NULL ELSE " . $field . " END)";
	}

	private function UnlockColumns($datasetId, $colsId)
	{
		Profiling::BeginTimer();
		// 1. Pone en null las referencias a columnas en dataset
		$queryCols = "UPDATE draft_dataset SET " .
								$this->conditionalResetter('dat_partition_column_id', $colsId) . "," .
								$this->conditionalResetter('dat_images_column_id', $colsId) . "," .
								$this->conditionalResetter('dat_latitude_column_id', $colsId) . "," .
								$this->conditionalResetter('dat_longitude_column_id', $colsId) . "," .
								$this->conditionalResetter('dat_latitude_column_segment_id', $colsId) . "," .
								$this->conditionalResetter('dat_longitude_column_segment_id', $colsId) . "," .
								$this->conditionalResetter('dat_caption_column_id', $colsId) . "," .
								$this->conditionalResetter('dat_geography_item_column_id', $colsId) . "
									WHERE dat_id = ?";
		App::Db()->exec($queryCols, array($datasetId));
		App::Db()->markTableUpdate('draft_dataset');

		// 2. Libera variables
		$this->UnlockColumnsVariables($datasetId, $colsId);

		// 3. Pone en null las referencias a columnas en symbology
		$queryCols = "UPDATE draft_symbology JOIN draft_variable ON mvv_symbology_id = vsy_id JOIN draft_metric_version_level ON mvv_metric_version_level_id = mvl_id
								 SET " . $this->conditionalResetter('vsy_cut_column_id', $colsId) . ",
										 " . $this->conditionalResetter('vsy_sequence_column_id', $colsId) . "
									WHERE mvl_dataset_id = ?";
		App::Db()->exec($queryCols, array($datasetId));
		$fixCutMode = "UPDATE draft_symbology JOIN draft_variable ON mvv_symbology_id = vsy_id JOIN draft_metric_version_level ON mvv_metric_version_level_id = mvl_id
										 SET vsy_cut_mode = 'S' WHERE mvl_dataset_id = ? AND vsy_cut_mode = 'V' AND vsy_cut_column_id is null";
		App::Db()->exec($fixCutMode, array($datasetId));
		App::Db()->markTableUpdate('draft_symbology');

		// 4. Pone en null las referencias circulares a columnas
		$circularCols = "UPDATE draft_dataset_column SET " .
											$this->conditionalResetter('dco_aggregation_weight_id', $colsId) . "
									WHERE dco_dataset_id = ?";
		App::Db()->exec($circularCols, array($datasetId));
		App::Db()->markTableUpdate('draft_dataset_column');
		Profiling::EndTimer();
	}

	private function UnlockColumnsVariables($datasetId, $colsId)
	{
		// 2. Pone en null las referencias a columnas en variable
		$queryCols = "UPDATE draft_variable JOIN draft_metric_version_level ON mvv_metric_version_level_id = mvl_id
								 SET " . 	$this->conditionalResetter('mvv_data_column_id', $colsId) . "," .
													$this->conditionalResetter('mvv_normalization_column_id', $colsId) . "," .
													$this->conditionalResetter('mvv_gap_data_column_id', $colsId) . "," .
													$this->conditionalResetter('mvv_gap_normalization_column_id', $colsId) . "
									WHERE mvl_dataset_id = ?";
		App::Db()->exec($queryCols, array($datasetId));

		$fixDataCols = "UPDATE draft_variable JOIN draft_metric_version_level ON mvv_metric_version_level_id = mvl_id
								 SET mvv_data = 'N' WHERE mvv_data_column_id IS NULL AND mvv_data = 'O' AND mvl_dataset_id = ?";
		App::Db()->exec($fixDataCols, array($datasetId));

		$fixNormalizationCols = "UPDATE draft_variable JOIN draft_metric_version_level ON mvv_metric_version_level_id = mvl_id
								 SET mvv_normalization = null WHERE mvv_normalization_column_id IS NULL AND mvv_normalization = 'O' AND mvl_dataset_id = ?";
		App::Db()->exec($fixNormalizationCols, array($datasetId));

		App::Db()->markTableUpdate('draft_variable');
	}

	private function GetFieldFromId($datasetId, $columnId)
	{
		Profiling::BeginTimer();
		// Obtiene el campo para la variable
		$params = array($datasetId, $columnId);
		$sql = "SELECT dco_field FROM draft_dataset_column where dco_dataset_id = ? and dco_id = ? LIMIT 1";
		$ret = App::Db()->fetchScalar($sql, $params);
		Profiling::EndTimer();
		return $ret;
	}

	private function resolveUniqueFieldName($datasetId, $field)
	{
		$columns = $this->GetDatasetColumns($datasetId);
		if ($this->listHasField($columns, $field) == false)
			return $field;
		$suffix = 1;
		while(true)
		{
			foreach($columns as $column)
			{
				$newField = $field . "_" . $suffix;
				if ($this->listHasField($columns, $newField) == false)
					return $newField;
				else
					$suffix++;
			}
		}
	}

	public function resolveStandardFieldName($datasetId)
	{
		return $this->resolveUniqueFieldName($datasetId, "dt_col");
	}
	private function listHasField($columns, $field)
	{
		foreach($columns as $column) {
			if ($column->getField() === $field)
				return true;
		}
		return false;
	}

	public function GetMaxOrder($datasetId)
	{
		$sql = "SELECT MAX(dco_order) FROM draft_dataset_column WHERE dco_dataset_id = ?";
		return App::Db()->fetchScalarIntNullable($sql, [$datasetId]);
	}

	public function UpdateOrder($colId, $datasetId, $position)
	{
		// Incrementa el order de las posteriores
		$sql = "UPDATE draft_dataset_column SET dco_order = dco_order + 1 WHERE
			dco_id != ? AND dco_dataset_id = ? AND dco_order >= ?";
		$ret = App::Db()->exec($sql, [$colId, $datasetId, $position]);
		App::Db()->markTableUpdate('draft_dataset_column');

		return $ret;
	}
	public function ResetColumnValues($dataset, $column)
	{
		// Incrementa el order de las posteriores
		$sql = "UPDATE " . $dataset->getTable() . " SET " . $column->getField() . " = NULL";
		App::Db()->exec($sql);
	}


	public function DeleteColumn($datasetId, $name)
	{
		$column = $this->GetColumnByVariable($datasetId, $name);
		if($column != null)
			$this->DeleteColumns($datasetId, [$column->getId()]);
	}

	public function UpdateLabel($col, $label)
	{
		$variable = $col->getVariable();
		$showCaption = ($label === null || trim($label) === "" ? $variable : $label);
		// Actualiza label manteniendo validez en caption
		$col->setLabel($label);
		$col->setCaption($showCaption);
		App::Orm()->save($col);
	}

	public function CreateColumnFromFields($dataset, $field, $variable, $caption, $label, $columnWidth, $fieldWidth,
		$decimals, $format, $measure, $alignment, $useInSummary, $useInExport, $position = null, $after = '')
	{
		$newColumn = new entities\DraftDatasetColumn();
		$newColumn->setDataset($dataset);
		$newColumn->setField($field);
		$newColumn->setVariable($variable);
		$newColumn->setCaption($caption);
		$newColumn->setLabel($label);

		$newColumn->setColumnWidth($columnWidth);
		$newColumn->setFieldWidth($fieldWidth);
		$newColumn->setDecimals($decimals);
		$newColumn->setFormat($format);
		$newColumn->setMeasure($measure);
		$newColumn->setAlignment($alignment);

		$newColumn->setUseInSummary($useInSummary);
		$newColumn->setUseInExport($useInExport);

		return $this->CreateColumn($dataset, $newColumn, $position, $after);
	}

	public function CreateColumn($dataset, $newColumn, $position = null, $after = '')
	{
		Profiling::BeginTimer();
		// Valida nombre
		$this->ValidateNewColumn($dataset, $newColumn);

		// Define el orden
		$order = $position;
		if($position === null)
			$order = $this->GetMaxOrder($dataset->getId()) + 1;
		$newColumn->setOrder($order);
		// Setea el dataset
		$newColumn->setDataset($dataset);

		App::Orm()->save($newColumn);

		if($position !== null)
			$this->UpdateOrder($newColumn->getId(), $dataset->getId(), $position);

		if($after !== '')
			$after = "AFTER " . $after;

		$format = $newColumn->getFormat();
		$fieldWidth = $newColumn->getFieldWidth();
		$dataType = DatasetTable::SpssToMySqlDataType($format, $fieldWidth);
		$field = $newColumn->getField();
		$table = $dataset->getTable();
		$alter = "ALTER TABLE " .$table . " ADD COLUMN " . $field . " " . $dataType . " NULL DEFAULT NULL " . $after;
		App::Db()->execDDL($alter);
		App::Db()->markTableUpdate($table);

		// Marca el cambio para las republicaciones
		DatasetService::DatasetChangedById($dataset->getId());

		Profiling::EndTimer();

		return $newColumn;
	}

	private function ValidateNewColumn($dataset, $newColumn)
	{
		$name = $newColumn->getVariable();
		if ($this->ColumnExists($dataset->getId(), $name))
			throw new PublicException("Ya existe una variable con el nombre '" . $name . "'.");
		// Valida field
		$field = $newColumn->getField();
		if ($field === null)
		{
			$field = $this->resolveStandardFieldName($dataset->getId());
			$newColumn->setField($field);
		}
		else
		{
			if ($this->FieldExists($dataset->getId(), $field))
				throw new PublicException("La columna '" . $field . "' ya existe en el dataset.");
		}

		// Ajusta caption y nombre
		DatasetColumns::FixCaption($newColumn);
		DatasetColumns::FixName($newColumn);
		$newColumn->setValueLabelsAreDirty(false);
	}
	public function GetColumnByVariable($datasetId, $variable)
	{
		return App::Orm()->findByProperties(entities\DraftDatasetColumn::class,
			['Variable' => $variable, 'Dataset.Id' => $datasetId]);
	}
	public function GetColumnByField($datasetId, $field)
	{
		return App::Orm()->findByProperties(entities\DraftDatasetColumn::class,
			['Field' => $field, 'Dataset.Id' => $datasetId]);
	}

	public function ColumnExists($datasetId, $variable)
	{
		return $this->GetColumnByVariable($datasetId, $variable) !== null;
	}
	public function FieldExists($datasetId, $field)
	{
		return $this->GetColumnByField($datasetId, $field) !== null;
	}

	private function CreateNumericColumn($dataset, $name, $originalField, $label, $summary, $position)
	{
		Profiling::BeginTimer();

		// Valida name
		if ($this->ColumnExists($dataset->getId(), $name))
			throw new PublicException("Ya existe una variable con el nombre '" . $name . "'.");

		$field = $this->resolveUniqueFieldName($dataset->getId(), $originalField);
		$caption = $label;
		if ($label === null || $label === "")
			$caption = $name;

		$ret = $this->CreateColumnFromFields($dataset, $field, $name, $caption, $label,
			8, 8, 0, Format::F, Measurement::Nominal, Alignment::Right,
			$summary, true, $position, $originalField);

		Profiling::EndTimer();

		return $ret;
	}

	private function RecodeValues($dataset, $column, $targetColumn, $labels)
	{
		Profiling::BeginTimer();
		// actualiza labels
		$valueCase = "";
		$fieldFrom = $column->getField();
		foreach($labels as $label)
		{
			if ($label->Caption === null)
				$valueCase .= "WHEN " . $fieldFrom . " IS NULL ";
			else
				$valueCase .= "WHEN " . $fieldFrom . "=" . SqlBuilder::FormatValue($label->Caption) . ' ';
			$valueCase .= "THEN " . SqlBuilder::FormatValue($label->Value) . " ";
		}
		$table = $dataset->getTable();
		$sql = "UPDATE " . $table . " SET " . $targetColumn->getField() . " = (CASE " . $valueCase . " END)";
		App::Db()->exec($sql);
		App::Db()->markTableUpdate($table);

		Profiling::EndTimer();
	}

	public function AutoRecodeValues($columnId, $labels, $newName, $newLabel)
	{
		Profiling::BeginTimer();
		$column = App::Orm()->find(entities\DraftDatasetColumn::class, $columnId);
		$dataset = $column->getDataset();
		$datasetId = $dataset->getId();
		$replaceOrginal = ($newName == '');

		DatasetService::DatasetChanged($dataset);

		// Crea la columna nueva
		if ($replaceOrginal)
		{
			$newName = $column->getVariable();
			$newLabel = $column->getLabel();
		}
		$newColumn = $this->CreateNumericColumn($dataset, $newName, $column->getField(), $newLabel,
							$column->getUseInSummary(), $column->getOrder() + 1);
		// Guarda sus etiquetas
		$this->UpdateLabels($newColumn->getId(), $labels);

		// Actualiza los valores
		$this->RecodeValues($dataset, $column, $newColumn, $labels);

		// Si corresponde, elimina la anterior
		if ($replaceOrginal) {
			$this->DeleteColumns($datasetId, array($columnId));
		}
		Profiling::EndTimer();
		return self::OK;
	}

	// Cada operacion se expresa como una plantilla SQL fija: los operandos solo
	// entran por los marcadores {n}, nunca por concatenacion libre. 'value' solo
	// convierte cadenas totalmente numericas: un CAST parcial aborta el UPDATE
	// en modo estricto.
	private static $columnOperations = [
		'impute' => ['types' => ['number'], 'result' => 'number', 'sql' => '{0}'],
		'imputeText' => ['types' => ['text'], 'result' => 'text', 'sql' => '{0}'],
		'add' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => '({0} + {1})'],
		'subtract' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => '({0} - {1})'],
		'divide' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => '({0} / NULLIF({1}, 0))'],
		'multiply' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => '({0} * {1})'],
		'mod' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => 'MOD({0}, NULLIF({1}, 0))'],
		'percent' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => '(({0} / NULLIF({1}, 0)) * 100)'],
		'int' => ['types' => ['number'], 'result' => 'number', 'sql' => 'TRUNCATE({0}, 0)'],
		'abs' => ['types' => ['number'], 'result' => 'number', 'sql' => 'ABS({0})'],
		'value' => ['types' => ['text'], 'result' => 'number',
			'sql' => "(CASE WHEN TRIM({0}) REGEXP '^[-]{0,1}[0-9]{1,20}([.][0-9]{1,10}){0,1}$' THEN CAST(TRIM({0}) AS DECIMAL(30,10)) ELSE NULL END)"],
		'concat' => ['types' => ['text', 'text'], 'result' => 'text', 'sql' => 'CONCAT({0}, {1})'],
		'left' => ['types' => ['text', 'number'], 'result' => 'text', 'sql' => 'LEFT({0}, GREATEST({1}, 0))'],
		'right' => ['types' => ['text', 'number'], 'result' => 'text', 'sql' => 'RIGHT({0}, GREATEST({1}, 0))'],
		'substring' => ['types' => ['text', 'number', 'number'], 'result' => 'text',
			'sql' => 'SUBSTRING({0}, GREATEST({1}, 0) + 1, GREATEST({2}, 0))'],
		'trim' => ['types' => ['text'], 'result' => 'text', 'sql' => 'TRIM({0})'],
		'string' => ['types' => ['number'], 'result' => 'text', 'sql' => 'CAST({0} AS CHAR)'],
		'length' => ['types' => ['text'], 'result' => 'number', 'sql' => 'CHAR_LENGTH({0})'],
		// Comparaciones: retornan 1 o 0. Solo la igualdad usa el operador seguro
		// frente a nulos (<=>), de modo que permita preguntar por [Nulo].
		'equals' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => '({0} <=> {1})'],
		'notEquals' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => '(NOT ({0} <=> {1}))'],
		'greater' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => '({0} > {1})'],
		'less' => ['types' => ['number', 'number'], 'result' => 'number', 'sql' => '({0} < {1})'],
		'between' => ['types' => ['number', 'number', 'number'], 'result' => 'number', 'sql' => '({0} BETWEEN {1} AND {2})'],
		'equalsText' => ['types' => ['text', 'text'], 'result' => 'number', 'sql' => '({0} <=> {1})'],
		'notEqualsText' => ['types' => ['text', 'text'], 'result' => 'number', 'sql' => '(NOT ({0} <=> {1}))'],
		'greaterText' => ['types' => ['text', 'text'], 'result' => 'number', 'sql' => '({0} > {1})'],
		'lessText' => ['types' => ['text', 'text'], 'result' => 'number', 'sql' => '({0} < {1})'],
		'betweenText' => ['types' => ['text', 'text', 'text'], 'result' => 'number', 'sql' => '({0} BETWEEN {1} AND {2})']
	];

	public function UpdateColumnValues($datasetId, $columnId, $operationKey, $operands)
	{
		Profiling::BeginTimer();
		$operation = $this->GetColumnOperation($operationKey);
		if (!is_array($operands) || count($operands) !== count($operation['types']))
			throw new PublicException('La cantidad de valores no corresponde a la operación indicada.');

		$columns = $this->GetDatasetColumnsById($datasetId);
		$target = $this->GetColumnOfDataset($columns, $columnId);
		$this->ValidateOperationResult($operation['result'], $target);

		$fragments = [];
		for ($n = 0; $n < count($operands); $n++)
			$fragments[] = $this->BuildOperandFragment($operands[$n], $operation['types'][$n], $columns);
		$expression = $this->ComposeColumnExpression($operation['sql'], $fragments);

		// Evita que un resultado mas largo que el campo aborte la actualizacion
		$valueSql = $expression['sql'];
		if ($this->ColumnIsText($target))
			$valueSql = "LEFT(" . $valueSql . ", " . (int)$target->getFieldWidth() . ")";

		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$table = $dataset->getTable();
		DatasetService::DatasetChanged($dataset);
		$sql = "UPDATE " . $this->QuoteTable($table) . " SET " . $this->QuoteField($target) . " = " . $valueSql;
		App::Db()->exec($sql, $expression['params']);
		$affected = App::Db()->lastRowsAffected();
		App::Db()->markTableUpdate($table);
		BackofficeDownloadCache::Clear($datasetId);

		Profiling::EndTimer();
		return array('completed' => true, 'affected' => $affected);
	}

	private function GetColumnOperation($operationKey)
	{
		if (!is_string($operationKey) || !array_key_exists($operationKey, self::$columnOperations))
			throw new PublicException('La operación indicada no es válida.');
		return self::$columnOperations[$operationKey];
	}

	private function GetDatasetColumnsById($datasetId)
	{
		$ret = [];
		foreach ($this->GetDatasetColumns($datasetId) as $column)
			$ret[$column->getId()] = $column;
		return $ret;
	}

	// Al resolver solo entre las columnas del dataset indicado se garantiza que
	// ninguna columna ajena pueda intervenir en la operacion.
	private function GetColumnOfDataset($columns, $columnId)
	{
		if (!array_key_exists($columnId, $columns))
			throw new PublicException('La columna indicada no pertenece al dataset.');
		return $columns[$columnId];
	}

	private function ColumnIsText($column)
	{
		return $column->getFormat() === Format::A;
	}

	private function ColumnIsNumeric($column)
	{
		return $column->getFormat() === Format::F;
	}

	private function ValidateOperationResult($resultType, $target)
	{
		if ($resultType === 'number' && !$this->ColumnIsNumeric($target))
			throw new PublicException('El resultado de la operación es numérico: la columna a actualizar debe ser numérica.');
		if ($resultType === 'text' && !$this->ColumnIsText($target))
			throw new PublicException('El resultado de la operación es un texto: la columna a actualizar debe ser de texto.');
	}

	private function BuildOperandFragment($operand, $type, $columns)
	{
		if (!is_object($operand) || !property_exists($operand, 't') || !property_exists($operand, 'v'))
			throw new PublicException('El valor indicado para la operación no es válido.');
		if ($operand->t === 'N')
			return ['sql' => 'NULL', 'params' => []];

		if ($operand->t === 'V')
			return $this->BuildLiteralFragment($operand->v, $type);
		if ($operand->t === 'C')
			return $this->BuildColumnFragment($operand->v, $type, $columns);
		throw new PublicException('El tipo de valor indicado para la operación no es válido.');
	}

	// Los numeros solo se incorporan si responden a un patron estricto; los
	// textos siempre viajan como parametro enlazado.
	private function BuildLiteralFragment($value, $type)
	{
		if (!is_scalar($value))
			throw new PublicException('El valor indicado para la operación no es válido.');
		if ($type === 'number')
		{
			$text = trim((string)$value);
			if (!preg_match('/^-?[0-9]{1,18}(\.[0-9]{1,18})?$/', $text))
				throw new PublicException('El valor indicado no es un número válido.');
			return ['sql' => '(' . $text . ')', 'params' => []];
		}
		return ['sql' => '?', 'params' => [(string)$value]];
	}

	private function BuildColumnFragment($value, $type, $columns)
	{
		$columnId = (int)$value;
		if (!is_scalar($value) || (string)$columnId !== (string)$value)
			throw new PublicException('La columna indicada no es válida.');
		if ($columnId < 0)
			throw new PublicException('Las variables especiales todavía no están disponibles para esta operación.');
		$column = $this->GetColumnOfDataset($columns, $columnId);
		if ($type === 'number' && !$this->ColumnIsNumeric($column))
			throw new PublicException('Una de las columnas indicadas debe ser numérica.');
		if ($type === 'text' && !$this->ColumnIsText($column))
			throw new PublicException('Una de las columnas indicadas debe ser de texto.');
		return ['sql' => $this->QuoteField($column), 'params' => []];
	}

	// Un operando puede aparecer mas de una vez en la plantilla: sus parametros
	// se agregan en el mismo orden en que aparecen los marcadores.
	private function ComposeColumnExpression($template, $fragments)
	{
		$parts = preg_split('/\{(\d)\}/', $template, -1, PREG_SPLIT_DELIM_CAPTURE);
		$sql = '';
		$params = [];
		for ($n = 0; $n < count($parts); $n++)
		{
			if ($n % 2 === 0)
			{
				$sql .= $parts[$n];
			}
			else
			{
				$fragment = $fragments[(int)$parts[$n]];
				$sql .= $fragment['sql'];
				$params = array_merge($params, $fragment['params']);
			}
		}
		return ['sql' => $sql, 'params' => $params];
	}

	private function QuoteField($column)
	{
		$field = $column->getField();
		if (!preg_match('/^[A-Za-z0-9_]+$/', $field))
			throw new \Exception('El nombre de campo de la columna no es válido.');
		return '`' . $field . '`';
	}

	private function QuoteTable($table)
	{
		if (!preg_match('/^[A-Za-z0-9_.]+$/', $table))
			throw new \Exception('El nombre de la tabla del dataset no es válido.');
		return $table;
	}

	public function UpdateLabels($columnId, $labels, $deletedLabels = array())
	{
		Profiling::BeginTimer();
		$column = App::Orm()->find(entities\DraftDatasetColumn::class, $columnId);
		$dataset = $column->getDataset();
		$datasetId = $dataset->getId();
		DatasetService::DatasetChanged($dataset, true);
		// crea
		$this->ExecInsertLabels($columnId, $labels);
		// actualiza
		$this->ExecUpdateLabels($columnId, $labels);
		// borra
		$this->ExecDeleteLabels($datasetId, $deletedLabels);
		// Devuelve el nuevo estado de cosas
		$ret = $this->GetDatasetColumnsLabels($datasetId, $columnId);
		Profiling::EndTimer();

		if (sizeof($ret) === 0)
			return array();
		else
			return $ret[$columnId];
	}

	private function ExecInsertLabels($columnId, $labels)
	{
		Profiling::BeginTimer();
		// actualiza labels
		$insertInto = "INSERT INTO draft_dataset_column_value_label (dla_dataset_column_id, dla_value, dla_caption, dla_order) VALUES ";
		$insertBlock = "";
		$insertCount = 0;
		$done = array();
		foreach($labels as $label)
		{
			$id = $label->Id;
			$value = $label->Value;
			if ($id == null && array_key_exists($value, $done) === false)
			{
				if ($insertBlock !== "") $insertBlock .= ",";
				$insertBlock .= "(" . $columnId . "," . SqlBuilder::FormatValue($value) . "," .
														SqlBuilder::FormatValue($label->Caption) . "," .
														SqlBuilder::FormatValue($label->Order) .")";
				$done[$value] = true;
				$insertCount++;

				if ($insertCount > 50)
				{
					$sql = $insertInto . $insertBlock;
					App::Db()->exec($sql);
					App::Db()->markTableUpdate('draft_dataset_column_value_label');
					$insertBlock = '';
					$insertCount = 0;
				}
			}
		}
		if ($insertCount > 0)
		{
			$sql = $insertInto . $insertBlock;
			App::Db()->exec($sql);
			App::Db()->markTableUpdate('draft_dataset_column_value_label');
		}

		Profiling::EndTimer();
	}
	private function ExecUpdateLabels($columnId, $labels)
	{
		Profiling::BeginTimer();
		// actualiza labels
		$valueIds = array();
		$valueCase = "";
		$captionCase = "";
		$orderCase = "";
		foreach($labels as $label)
		{
			$id = $label->Id;
			if ($id != null)
			{
				$valueIds[] = $id;
				$valueCase .= "WHEN dla_id=" . $id . " THEN " . SqlBuilder::FormatValue($label->Value) . " ";
				$captionCase .= "WHEN dla_id=" . $id . " THEN " . SqlBuilder::FormatValue($label->Caption) . " ";
				$orderCase .= "WHEN dla_id=" . $id . " THEN " . SqlBuilder::FormatValue($label->Order) . " ";
			}
		}
		if (sizeof($valueIds) > 0)
		{
			$sql = "UPDATE draft_dataset_column_value_label SET dla_value = (CASE " . $valueCase . " END),
																						dla_caption = (CASE " . $captionCase . " END),
																						dla_order = (CASE " . $orderCase . " END)
									WHERE dla_id IN (" . join(',', $valueIds) . ") AND dla_dataset_column_id = ?";
			App::Db()->exec($sql, array($columnId));
			App::Db()->markTableUpdate('draft_dataset_column_value_label');
		}
		Profiling::EndTimer();
	}
	private function ExecDeleteLabels($datasetId, $deletedLabels)
	{
		Profiling::BeginTimer();

		if (sizeof($deletedLabels) > 0)
		{
			$labels = "DELETE draft_dataset_column_value_label FROM draft_dataset_column_value_label
										JOIN draft_dataset_column ON dla_dataset_column_id = dco_id
						WHERE dco_dataset_id = ? AND dla_id IN (" . join(',', $deletedLabels) . ")";
			App::Db()->exec($labels, array($datasetId));
		}
		Profiling::EndTimer();
	}

	public function GetColumnUniqueValues($datasetId, $columnId)
	{
		Profiling::BeginTimer();

		$dataset= App::Orm()->find(entities\DraftDataset::class, $datasetId);
		$col = App::Orm()->find(entities\DraftDatasetColumn::class, $columnId);
		if ($col->getDataset()->getId() != $datasetId)
			throw new PublicException('El dataset no se corresponde con la columna indicada');
		$field = "`" . $col->getField() . "`";
		$rows = App::Db()->fetchAll("
						SELECT null Id, (@rowNumber := @rowNumber + 1) AS Value, Caption, @rowNumber AS `Order`, Count FROM (
						SELECT " . $field . " Caption, count(*) Count FROM " . $dataset->getTable() . " GROUP BY " . $field . " ORDER BY " . $field . ") d,
									 (SELECT @rowNumber := 0) r");
		Profiling::EndTimer();
		return $rows;
	}

	public function SetColumnOrder($datasetId, $idsArray)
	{
		Profiling::BeginTimer();
		$dataset = App::Orm()->find(entities\DraftDataset::class, $datasetId);
		DatasetService::DatasetChanged($dataset, true);

		foreach($idsArray as $id => $order)
		{
			$col = App::Orm()->find(entities\DraftDatasetColumn::class, $id);
			if ($col->getDataset()->getId() != $datasetId)
				throw new PublicException('Invalid column Id.');
			$col->setOrder($order);
			App::Orm()->save($col);
		}
		Profiling::EndTimer();
	}
	public function GetDatasetColumns($datasetId)
	{
		Profiling::BeginTimer();

		$ret = App::Orm()->findManyByProperty(entities\DraftDatasetColumn::class, 'Dataset', $datasetId, 'Order');

		Profiling::EndTimer();
		return $ret;
	}
	public function GetDatasetColumnsLabels($datasetId, $filterColumnId = null)
	{
		Profiling::BeginTimer();
		$filter = ($filterColumnId !== null ? " AND dco_id = " . $filterColumnId : "");
		// Devuelve todas las etiquetas de valores de columna
		// de un dataset en forma de diccionario[id_columna]['Id' => id, 'Value' => value, 'Caption' => caption, 'Order' => order]
		$sql = "SELECT dla_dataset_column_id, dla_id, dla_value, dla_caption, dla_order
									FROM draft_dataset_column_value_label JOIN draft_dataset_column ON dco_id = dla_dataset_column_id
									WHERE dco_dataset_id = ? " . $filter . " ORDER BY dla_dataset_column_id, dla_order, dla_id";
		$labels = App::Db()->fetchAllByPos($sql, array($datasetId));
		$ret = array();
		$lastColumnId = null;
		$currentSet = array();
		foreach($labels as $label)
		{
			if ($label[0] !== $lastColumnId)
			{
				if (sizeof($currentSet) > 0)
				{
					Arr::SortByKey($currentSet, 'Order');
					$ret[$lastColumnId] = $currentSet;
					$currentSet = array();
				}
				$lastColumnId = $label[0];
			}
			$currentSet[] = ['Id' => $label[1], 'Value' => $label[2], 'Caption' => $label[3], 'Order' => $label[4]];
		}
		if (sizeof($currentSet) > 0)
		{
			Arr::SortByKey($currentSet, 'Order');
			$ret[$lastColumnId] = $currentSet;
			$currentSet = array();
		}
		Profiling::EndTimer();
		return $ret;
	}
}

