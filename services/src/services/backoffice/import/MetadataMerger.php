<?php

namespace helena\services\backoffice\import;

use helena\classes\App;
use helena\entities\backoffice as entities;

use minga\framework\Arr;
use minga\framework\Str;


class MetadataMerger
{
	private	$datasetId;
	private $keepOldMetadata;
	private	$maxPreviousId;
	public $errors = "";
	private $lastIdList;
	private $dropSourceDataset;
	private $targetDatasetId;

	public function __construct($datasetId, $targetDatasetId, $keepOldMetadata, $maxPreviousId, $dropSourceDataset)
	{
		$this->datasetId = intval($datasetId);
		$this->targetDatasetId = intval($targetDatasetId);
		$this->keepOldMetadata = $keepOldMetadata;
		$this->maxPreviousId = intval($maxPreviousId);
		$this->dropSourceDataset = $dropSourceDataset;
	}
	public function MergeMetadata()
	{
		if ($this->keepOldMetadata)
		{
			// 1) update metadatos de columnas viejas sobre nuevas (varlabel, widht, etc).
			$this->MigrateBasicColumnAttributes();
			// 2) drop e insert de valuesLabels viejos por sobre los nuevos.
			$this->MigrateValueLabels();
		}
		// 3) copiar en las columnas que tienen fk los homologos nuevos joineando por var_name
		$turnedToNull = $this->MigrateColumnReferences();
		$turnedToNull .= $this->MigrateAggregations();
		$this->errors = $turnedToNull;
		if ($this->dropSourceDataset)
		{
			$this->dropSourceDatasetColumns();
		}
		// 4) Pone un orden secuencial
		$this->FixColumnOrder();
	}

	private function dropSourceDatasetColumns()
	{
		// 1) determina el universo de datos
		$columnsWhere = " WHERE dc_old.dco_dataset_id = " . $this->datasetId . $this->getIdRangeCondition();
		// 2) drop de los valueslables viejos
		$deleteValues = "DELETE FROM draft_dataset_column_value_label WHERE dla_dataset_column_id IN (SELECT dco_id FROM draft_dataset_column dc_old " .
													$columnsWhere . ")";
		App::Db()->exec($deleteValues);
		// 3) drop de las columnas viejas
		$deleteColumns = "DELETE dc_old FROM draft_dataset_column dc_old " . $columnsWhere ;
		App::Db()->exec($deleteColumns);
	}

	private function MigrateValueLabels()
	{
		// Borra las de destino
		$deleteValues = "DELETE FROM draft_dataset_column_value_label WHERE dla_dataset_column_id IN (SELECT dco_new_id FROM " .
													$this->MatchSubtable() . " WHERE dco_new_id IS NOT NULL)";
		App::Db()->exec($deleteValues);
		// Copia las de origen
		$insertValues = "INSERT INTO draft_dataset_column_value_label (dla_value, dla_caption, dla_dataset_column_id)
												SELECT dla_value, dla_caption, dco_new_id FROM draft_dataset_column_value_label INNER JOIN " .
													$this->MatchSubtable() . " ON matches.dco_old_id = dla_dataset_column_id
													WHERE dco_new_id IS NOT NULL ORDER BY dla_id";
		App::Db()->exec($insertValues);
	}
	private function MigrateBasicColumnAttributes()
	{
		// 1. Mantiene aggregations
		$attributes = array('dco_caption', 'dco_label', 'dco_column_width',
										'dco_field_width', 'dco_decimals', 'dco_format', 'dco_measure', 'dco_alignment',
										'dco_use_in_summary', 'dco_use_in_export', 'dco_order');
		$this->MigrateColumnAttributes($attributes);
	}
	private function MigrateAggregations()
	{
		// 1. Mantiene aggregations
		$attributes = array('dco_aggregation_transpose_labels', 'dco_aggregation_label', 'dco_aggregation');
		$this->MigrateColumnAttributes($attributes);
		// 2. Pasa la columna de peso de agregación
		$datasetInfo = array();
		$datasetInfo['table'] = 'draft_dataset_column';
		$datasetInfo['datasetField'] = 'dco_dataset_id';
		$datasetInfo['fieldCaption'] = "dco_caption";

		$message = "El peso para la agregación de la variable ha quedado vacío debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		return $this->MigrateColumnFormatted($datasetInfo, 'dco_aggregation_weight_id', $message);
	}
	private function MigrateColumnReferences()
	{
		$turnedToNull = "";
		// De dataset
		$datasetInfo = array('table' => 'draft_dataset', 'datasetField' => 'dat_id', 'fieldCaption' => 'dat_caption');

		$message = "La variable seleccionada para la descripción ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'dat_caption_column_id', $message);
		$message = "La variable seleccionada para la imagen ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'dat_images_column_id', $message);
		$message = "La variable seleccionada para la partición ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'dat_partition_column_id', $message);
		$message = "La variable seleccionada para la latitud ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'dat_latitude_column_id', $message);
		$message = "La variable seleccionada para la longitud ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'dat_longitude_column_id', $message);
		$message = "La variable seleccionada para la latitud ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'dat_latitude_column_segment_id', $message);
		$message = "La variable seleccionada para la longitud ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'dat_longitude_column_segment_id', $message);

		// De marker
		$datasetInfo['table'] = 'draft_dataset_marker';
		$datasetInfo['datasetField'] = '(SELECT dat_id FROM draft_dataset where dat_marker_id = dmk_id)';
		$datasetInfo['fieldCaption'] = "(SELECT dat_caption FROM draft_dataset where dat_marker_id = dmk_id)";
		$datasetInfo['entityId'] = 'dmk_id';
		$message = "La variable de contenido de marcadores de 'ENTITY_CAPTION' ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'dmk_content_column_id', $message);

		// Cut, de symbology de indicadores
		$datasetInfo['table'] = 'draft_symbology';
		$datasetInfo['datasetField'] = '(SELECT mvl_dataset_id FROM draft_metric_version_level, draft_variable WHERE mvv_metric_version_level_id = mvl_id AND mvv_symbology_id = vsy_id)';
		$datasetInfo['fieldCaption'] = "(SELECT CONCAT(mtr_caption, ' (', mvr_caption, ')') FROM draft_metric, draft_metric_version, draft_metric_version_level, draft_variable WHERE mvr_metric_id = mtr_id AND mvl_metric_version_id = mvl_id AND mvl_id = mvv_metric_version_level_id AND mvv_metric_version_level_id = mvl_id AND mvv_symbology_id = vsy_id)";
		$datasetInfo['entityId'] = 'vsy_id';

		$message = "La variable de segmentación del indicador 'ENTITY_CAPTION' ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'vsy_cut_column_id', $message);
		// Sequence, de symbology de indicadores
		$message = "La variable de secuencia del indicador 'ENTITY_CAPTION' ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'vsy_sequence_column_id', $message);

		// De variables de indicadores
		$datasetInfo['table'] = 'draft_variable';
		$datasetInfo['datasetField'] = '(SELECT mvl_dataset_id FROM draft_metric_version_level WHERE mvl_id = mvv_metric_version_level_id)';
		$datasetInfo['fieldCaption'] = "(SELECT CONCAT(mtr_caption, ' (', mvr_caption, ')') FROM draft_metric, draft_metric_version, draft_metric_version_level WHERE mvr_metric_id = mtr_id AND mvl_metric_version_id = mvl_id AND mvl_id = mvv_metric_version_level_id)";
		$datasetInfo['entityId'] = 'mvv_id';
		// datacolumn
		$message = "La variable del indicador 'ENTITY_CAPTION' ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'mvv_data_column_id', $message);
		// normalizationcolumn
		$message = "La variable de normalización para el indicador 'ENTITY_CAPTION' ha quedado vacía debido a que el nuevo dataset no contiene una variable llamada 'VARIABLE_CAPTION'.";
		$turnedToNull .= $this->MigrateColumnFormatted($datasetInfo, 'mvv_normalization_column_id', $message);

		$this->DeleteOrphanVariables();

		return $turnedToNull;
	}
	private function DeleteOrphanVariables()
	{
		if (sizeof($this->lastIdList) > 0)
		{
			$ids = join(',', $this->lastIdList);
			// Recibe los mvv_id para borrar sus escalas
			$deleteValues = "DELETE draft_variable_value_label FROM draft_variable_value_label
													WHERE vvl_variable_id IN (" . $ids . ")";
			App::Db()->exec($deleteValues);
		}
	}

	private function MigrateColumnFormatted($datasetInfo, $fieldColumn, $message)
	{
		$ret = '';
		$this->lastIdList = array();
		$items = $this->MigrateColumn($datasetInfo, $fieldColumn);
		if (sizeof($items) > 0)
		{
			foreach($items as $item)
			{
				$msg = $message;
				$msg = Str::Replace($msg, 'ENTITY_CAPTION', $item['entity_caption']);
				$msg = Str::Replace($msg, 'VARIABLE_CAPTION', $item['variable_caption']);
				if (array_key_exists('entity_id', $item))
					$this->lastIdList[] = $item['entity_id'];
				$ret .= $msg . '.\n';
			}
		}
		return $ret;
	}
	private function MigrateColumnAttributes($attributes)
	{
		$columns = "";
		foreach($attributes as $attribute)
			$columns .= ", draft_dataset_column." . $attribute . " = matches." . $attribute;
		$columns = substr($columns, 1);
 		// Pasa columnas
		$update = "UPDATE draft_dataset_column JOIN " . $this->MatchSubtable($attributes) . " ON dco_id = matches.dco_new_id
								SET " . $columns;
		App::Db()->exec($update);
	}

	private function MigrateColumn($datasetInfo, $fieldColumn)
	{
		$table = $datasetInfo['table'];
		$datasetField = $datasetInfo['datasetField'];
		$fieldCaption = $datasetInfo['fieldCaption'];

		$subTable = $this->MatchSubtable();
		$entityId = Arr::SafeGet($datasetInfo, 'entityId');
		if ($entityId)
			$entityPart = ', ' . $entityId . ' as entity_id ';
		else
			$entityPart = '';

		$sql = "SELECT " . $fieldCaption . " AS entity_caption,  dco_old_caption AS variable_caption " .
									$entityPart . " FROM " . $table . ", " . $subTable . " WHERE
							" . $fieldColumn . " IS NOT NULL AND " . $fieldColumn . " = matches.dco_old_id
										AND matches.dco_new_id IS NULL AND " . $this->datasetId . " IN (" . $datasetField . ")";
		$changedToNull = App::Db()->fetchAll($sql);
		// Pasa keys
		$update = "UPDATE " . $table . " JOIN " . $subTable . " ON " . $fieldColumn . " = matches.dco_old_id
								SET " . $fieldColumn . " =  matches.dco_new_id
								WHERE " . $fieldColumn . " IS NOT NULL AND " . $this->targetDatasetId . " IN (" . $datasetField . ")";

		App::Db()->exec($update);
		// Listo
		return $changedToNull;
	}
	private function MatchSubtable($attributes = array())
	{
		$extraAttributes = join(',dc_old.', $attributes);
		if ($extraAttributes != "") $extraAttributes = ',dc_old.' . $extraAttributes;
		return  "(SELECT dc_old.dco_id AS dco_old_id, dc_new.dco_id AS dco_new_id, dc_old.dco_caption AS dco_old_caption ".
									$extraAttributes . "
									FROM draft_dataset_column dc_old
									LEFT JOIN draft_dataset_column dc_new
									ON   dc_new.dco_variable = dc_old.dco_variable
									AND dc_new.dco_dataset_id = " . $this->targetDatasetId . " AND dc_new.dco_id > " . $this->maxPreviousId . "
									WHERE dc_old.dco_dataset_id = " . $this->datasetId . $this->getIdRangeCondition() . ") matches";
	}
	private function getIdRangeCondition()
	{
		if ($this->maxPreviousId > 0)
			return " AND dc_old.dco_id <= " . $this->maxPreviousId;
		else
			return "";
	 }

	private function FixColumnOrder()
	{
		$minId = App::Db()->fetchScalarIntNullable("SELECT MIN(dco_id) FROM draft_dataset_column WHERE dco_dataset_id = ?", array($this->targetDatasetId));
		if ($minId !== null)
		{
			$sql = "UPDATE draft_dataset_column SET dco_order = (dco_id - " . $minId . " + 1) WHERE dco_dataset_id = ?";
			App::Db()->exec($sql, array($this->targetDatasetId));
		}
	}

}

