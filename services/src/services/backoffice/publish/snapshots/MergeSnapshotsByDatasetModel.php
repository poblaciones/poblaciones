<?php

namespace helena\services\backoffice\publish\snapshots;

use helena\services\backoffice\publish\PublishDataTables;

use minga\framework\Profiling;
use minga\framework\Arr;
use minga\framework\Str;
use helena\classes\SpecialColumnEnum;
use helena\classes\App;
use minga\framework\locking\CreateMergeLock;
use minga\framework\PublicException;
use minga\framework\ErrorException;
use helena\db\backoffice\WorkModel;
use helena\entities\frontend\metadata\TupleMetadataInfo;
use helena\entities\frontend\metadata\MetadataInfo;


class MergeSnapshotsByDatasetModel
{
	public function GetComparableVariables($datasetId, $compareDatasetId, $sameDataset)
	{
		// Trae info de los levels
		$snapshotModel = new SnapshotByDatasetModel();
		$levels = $snapshotModel->GetDatasetLevels($datasetId);
		$levelsCompare = ($sameDataset ? $levels : $snapshotModel->GetDatasetLevels($compareDatasetId));
		if (sizeof($levelsCompare) == 0)
			throw new PublicException("El dataset de comparación no contiene niveles definidos.");

		// Construye la lista de variables que son
		// comparables de ambos niveles
		$variablePairs = $this->GetRequiredVariables($levels, $levelsCompare);
		return $variablePairs;
	}
	public function MergeSnapshots($datasetId, $compareDatasetId)
	{
		// trae info de los datasets
		$sameDataset = ($datasetId === $compareDatasetId);
		$workModel = new WorkModel(false);
		$dataset = $workModel->GetDataset($datasetId);
		$datasetCompare = ($sameDataset ? $dataset : $workModel->GetDataset($compareDatasetId));

		$variablePairs = $this->GetComparableVariables($datasetId, $compareDatasetId, $sameDataset);
		// Identifica las tablas
		$table = SnapshotByDatasetModel::SnapshotTable($dataset['dat_table']);
		$tableCompare = SnapshotByDatasetModel::SnapshotTable($datasetCompare['dat_table']);
		$mergeTable = self::TableName($table, $compareDatasetId);

		// Bloquea para empezar
		$lock = new CreateMergeLock($mergeTable);
		$lock->LockWrite();
		if (App::Db()->tableExists($mergeTable))
		{	// Fue resuelta desde otro thread
			$lock->Release();
			return;
		}
		Profiling::BeginTimer();

		// Trae las tuplas que lo conectan
		if (!$sameDataset)
		{
			$tuple = $this->GetTuple($dataset['dat_geography_id'], $datasetCompare['dat_geography_id']);
			if (!$tuple && $dataset['dat_geography_id'] !== $datasetCompare['dat_geography_id'])
			{
				$lock->Release();
				throw new PublicException("No hay relación (tuplas definidas) entre los niveles geográficos de los datasets  '" . $dataset['dat_caption']
						. "' (" . $dataset['dat_geography_id'] . ") y '" . $datasetCompare['dat_caption'] . "' (" .  $datasetCompare['dat_geography_id'] . ").");
			}
		}
		else
			$tuple = null;

		// Empieza a preparar las columnas
		$columns = $this->BuildHeaders($dataset, $sameDataset);

		// Agrega las columnas de variables
		$this->AddColumnsByVariable($columns, $variablePairs, $sameDataset);

		// Prepara el espacio temporal
		$tmpTable = $mergeTable . "_tmp";
		App::Db()->dropTable($tmpTable);

		// Hace el insert
		$this->CreateTable($tmpTable, $columns);

		try
		{
			$this->InsertValues($tmpTable, $table, $tableCompare, ($tuple ? $tuple['gtu_id'] : null), $columns);
			App::Db()->renameTable($tmpTable, $mergeTable);

			$lock->Release();
		}
		catch(\Exception $e)
		{
			App::Db()->dropTable($tmpTable);
			$lock->Release();
			throw $e;
		}
		Profiling::EndTimer();
	}

	public static function TableName($table, $compareDatasetId)
	{
		return $table . "_matrix_" . $compareDatasetId;
	}

	private function GetRequiredVariables($levels, $levelsCompare)
	{
		$ret = [];
		// Recorre las variables armando pares de variables a matchear
		$levelPairs = $this->GetLevelPairs($levels, $levelsCompare);
		foreach($levelPairs as $pair)
		{
			$level = $pair[0];
			$levelCompare = $pair[1];
			Arr::AddRange($ret, self::GetRequiredVariablesForLevelPair($level, $levelCompare));
		}
		return $ret;
	}

	public static function GetRequiredVariableForLevelPairObjects($level, $levelCompare, $variableId)
	{
		$variablePairs = self::GetRequiredVariablesForLevelPairObjects($level, $levelCompare);
		foreach($variablePairs as $variablePair)
		{
			$variable = $variablePair[0];
			$variableCompare = $variablePair[1];
			if ($variable->attributes['mvv_id'] === $variableId)
				return $variableCompare;
		}
		throw new ErrorException("No ha podido identificarse la variable de comparación.");
	}

	public function GetTuplesMetadata($listOfIds)
	{
		if (sizeof($listOfIds) == 0)
			return ['TupleGeography' => [], 'Metadata' => []];

		$asText = Str::JoinInts($listOfIds);
		$sql = "SELECT gtu_geography_id, gtu_previous_geography_id, gtu_metadata_id
								   FROM geography_tuple WHERE gtu_geography_id IN (" . $asText . ") OR gtu_previous_geography_id IN (" . $asText . ")";
		$res = App::Db()->fetchAll($sql);
		$tupleMetadatas = [];
		foreach($res as $row)
		{
			$metadata = new TupleMetadataInfo();
			$metadata->Fill($row);
			$tupleMetadatas[] = $metadata;
		}
		$sql = "SELECT distinct m.* FROM geography_tuple JOIN metadata m ON gtu_metadata_id = met_id
									WHERE gtu_geography_id IN (" . $asText . ") OR gtu_previous_geography_id IN (" . $asText . ")";
		$res = App::Db()->fetchAll($sql);
		$metadatadas = [];
		foreach ($res as $row) {
			$metadata = new MetadataInfo();
			$metadata->Fill($row);
			$metadatadas[] = $metadata;
		}

		return ['TupleGeography' => $tupleMetadatas, 'Metadata' => $metadatadas];
	}
	public static function GetRequiredVariablesForLevelPairObjects($level, $levelCompare)
	{
		Profiling::BeginTimer();

		$sql = "SELECT metric_version.*, metric_version_level.*, dataset.*
							FROM metric_version
							JOIN metric_version_level ON mvl_metric_version_id = mvr_id
							  JOIN dataset ON dat_id = mvl_dataset_id

							WHERE mvl_id IN (?, ?)";

		$ret = App::Db()->fetchAll($sql, array($level->Id, $levelCompare->Id));
		foreach($ret as &$metricVersionLevel)
		{
			$variables = Variable::GetVariables($metricVersionLevel);
			$metricVersionLevel['variables'] = $variables;
		}
		if ($ret[0]['mvl_id'] == $level->Id)
		{
			$list = self::GetRequiredVariablesForLevelPair($ret[0], $ret[1]);
		}
		else
		{
			$list= self::GetRequiredVariablesForLevelPair($ret[1], $ret[0]);
		}
		Profiling::EndTimer();
		return $list;
	}

	public static function CheckTableExists($tableName, $datasetId, $datasetCompareId)
	{
		if (App::Db()->tableExists($tableName))
			return;
		// La crea
		Profiling::BeginTimer();
		$c = new MergeSnapshotsByDatasetModel();
		$c->MergeSnapshots($datasetId, $datasetCompareId);
		Profiling::EndTimer();
	}

	public static function GetRequiredVariablesForLevelPair($level, $levelCompare)
	{
		$ret = [];
		foreach ($level['variables'] as $variable) {
			$formula = Variable::FormulaToString($variable->attributes);

			foreach ($levelCompare['variables'] as $variableCompare) {
				$formulaCompare = Variable::FormulaToString($variableCompare->attributes);
				if ($formula == $formulaCompare)
				{
					$ret[] = [$variable, $variableCompare];
				}
			}
		}
		return $ret;
	}

	private function GetLevelPairs($levels, $levelsCompare)
	{
		$ret = [];
		// Recorre las variables armando pares de variables a matchear
		foreach ($levels as $level) {
			foreach ($levelsCompare as $levelCompare) {
				// Entra en los niveles que coincide el indicador
				if ($level['mvr_metric_id'] == $levelCompare['mvr_metric_id']
					&& $level['mvr_id'] != $levelCompare['mvr_id']) {
					$ret[] = [$level, $levelCompare];
				}
			}
		}
		return $ret;
	}
	private function GetTuple($geographyId, $compareGeographyId)
	{
		Profiling::BeginTimer();
		$sql = "SELECT gtu_id FROM geography_tuple WHERE gtu_geography_id = ?
											AND gtu_previous_geography_id = ?";
		$ret = App::Db()->fetchAssoc($sql, array($geographyId, $compareGeographyId));
		Profiling::EndTimer();
		return $ret;
	}

	private function BuildHeaders($dataset, $sameDataset)
	{
		// $dataset = recibe $dataset + geography
		$columns = [];
		$columns[] = ['sna_id', 'int(11) PRIMARY KEY', 't1.sna_id'];
		$columns[] = ['sna_geography_item_id', 'int(11) NOT NULL', 't1.sna_geography_item_id'];
		$columns[] = ['sna_geography_previous_item_id', 'int(11) NOT NULL', ($sameDataset ? 't1.sna_geography_item_id' : 't2.sna_geography_item_id')];
		$columns[] = ['sna_urbanity', "char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N'", 't1.sna_urbanity'];
		$columns[] = ['sna_description', 'varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL', 't1.sna_description'];
		// resuelve el ícono
		if ($dataset['dmk_type'] !== 'N' && $dataset['dmk_source'] === 'V')
		{
			$columns[] = ['sna_symbol', 'varchar(10240) COLLATE utf8_unicode_ci DEFAULT NULL', 't1.sna_symbol'];
		}
		$columns[] = ['sna_feature_id', 'bigint(11) NOT NULL', 't1.sna_feature_id'];
		$columns[] = ['sna_area_m2', 'double NOT NULL', 't1.sna_area_m2'];
		if ($dataset['partition_column_field'])
		{
			$columns[] = ['sna_partition', 'int(11) NOT NULL', 't1.sna_partition'];
		}
		if ($dataset['dat_are_segments'])
		{
			$columns[] = ['sna_segment', 'linestring NOT NULL', 't1.sna_segment'];
        }
		$columns[] = ['sna_envelope', 'polygon NOT NULL', 't1.sna_envelope'];
		$columns[] = ['sna_location', 'point NOT NULL', 't1.sna_location'];

		return $columns;
	}

	private function CreateTable($mergeTable, $columns)
	{
		Profiling::BeginTimer();

		// Hace el drop preventivo
		App::Db()->dropTable($mergeTable);
		// Hace el create
		$sqlCols = '';
		foreach($columns as $column)
			$sqlCols .= "," . $column[0] . ' ' . $column[1];
		$sql = "CREATE TABLE " . $mergeTable . " (" . substr($sqlCols, 1) . ",
								 INDEX (sna_geography_item_id), SPATIAL INDEX(sna_envelope), SPATIAL INDEX(sna_location)) ENGINE=MyISAM;";
		App::Db()->execDDL($sql);
		App::Db()->markTableUpdate($mergeTable);

		// Listo
		Profiling::EndTimer();
	}

	private function InsertValues($mergeTable, $table1, $table2, $tupleId, $columns)
	{
		Profiling::BeginTimer();

		$sqlCols = '';
		foreach($columns as $column)
			$sqlCols .= "," . $column[0];
		$sqlValues = '';
		foreach($columns as $column)
			$sqlValues .= "," . ($column[2] === null ? "null" :  $column[2]);

		// Arma el FROM
		$sql = "INSERT INTO " . $mergeTable . " (" . substr($sqlCols, 1) . ")
						SELECT " . substr($sqlValues, 1);
		// Pone valores
		$args = [];
		$sql .= " FROM " . $table1 . " t1 ";
		if ($table1 !== $table2)
		{
			if ($tupleId)
			{
// 					  INNER JOIN geography_item g ON g.gei_id = t1.sna_geography_item_id
					$sql .= " INNER JOIN geography_tuple_item ON gti_geography_item_id = t1.sna_geography_item_id
						AND gti_geography_tuple_id = ?
					 INNER JOIN " . $table2 . " t2 ON t2.sna_geography_item_id = gti_geography_previous_item_id ";
				$args = array($tupleId);
			}
			else
			{
				// Ambos indicadores fueron georreferenciados con la misma geografía
				$sql .= " INNER JOIN " . $table2 . " t2 ON t2.sna_geography_item_id = t1.sna_geography_item_id ";
				$args = [];
			}

		}
		// Cierra el select
		$sql .= " ORDER BY t1.sna_id";
        App::Db()->exec($sql, $args);
		App::Db()->markTableUpdate($mergeTable);

		// AND g.gei_code IN ('067911304', '067911302', '067911301')

/*echo $sql;
		echo $tupleId;
		exit;*/
		Profiling::EndTimer();
	}

	private function AddColumnsByVariable(&$columns, $variablePairs, $sameDataset)
	{
		foreach($variablePairs as $pair)
		{
			$this->AddColumnsByVariablePair($columns, $pair[0], $pair[1], $sameDataset);
		}
	}
	private function UseProportionalDelta($variable)
	{
		return $variable->attributes['mvv_normalization'] == SpecialColumnEnum::NullValue
			|| $variable->attributes['mvv_normalization_scale'] != 100;
	}
	private function AddColumnsByVariablePair(&$columns, $variable1, $variable2, $sameDataset)
	{
		$t2 = ($sameDataset ? 't1' : 't2');
		// Pasa valores
		$value1 = 'sna_' . $variable1->Id() . '_value';
		if (Arr::IndexOfByNamedValue($columns, 0, $value1) == -1)
			$columns[] = [$value1, 'double NULL', 't1.' . $value1];
		$value2 = 'sna_' . $variable2->Id() . '_value';
		if (Arr::IndexOfByNamedValue($columns, 0, $value2) == -1)
			$columns[] = [$value2, 'double NULL', $t2 . '.' . $value2];

		// Pasa totales
		$value1 = 'sna_' . $variable1->Id() . '_total';
		if (Arr::IndexOfByNamedValue($columns, 0, $value1) == -1)
			$columns[] = [$value1, 'double NULL', 't1.' . $value1];
		$value2 = 'sna_' . $variable2->Id() . '_total';
		if (Arr::IndexOfByNamedValue($columns, 0, $value2) == -1)
			$columns[] = [$value2, 'double NULL', $t2 . '.' . $value2];

		// Calcula la categoría de matriz
		$category1 = 'sna_' . $variable1->Id() . '_value_label_id';
		$category2 = 'sna_' . $variable2->Id() . '_value_label_id';
		$columns[] = ['sna_' . $variable1->Id() . '_' . $variable2->Id() . '_value_matrix_id', 'varchar(50) NOT NULL',
								'CONCAT(t1.' . $category1 . ",'_'," . $t2 . "." . $category2 . ')'];

		// Calcula la categoría de diferencia porcentual
		$value1ForSegmentation = $this->CalculateNormalizedValueField($variable1, 't1.');
		$value2ForSegmentation = $this->CalculateNormalizedValueField($variable2, $t2 . '.');

		if ($this->UseProportionalDelta($variable1))
		{
			$value = 'CASE WHEN (' . $value2ForSegmentation . ') = 0 THEN NULL ELSE ('
				. '((' . $value1ForSegmentation . ') / (' . $value2ForSegmentation . ')) * 100 - 100) END ';
		}
		else
		{
			$value = '(' . $value1ForSegmentation . ' - ' . $value2ForSegmentation . ')';
		}
		;// Crea una variable para armar el case
		$v = new Variable([], []);
		$v->attributes['vsy_cut_mode'] = 'M';
		$v->attributes['values'] = [];
		$v->attributes['values'][] = ['vvl_id' => 1, 'vvl_value' => null];
		$v->attributes['values'][] = ['vvl_id' => 2, 'vvl_value' => -50];
		$v->attributes['values'][] = ['vvl_id' => 3, 'vvl_value' => -20];
		$v->attributes['values'][] = ['vvl_id' => 4, 'vvl_value' => -10];
		$v->attributes['values'][] = ['vvl_id' => 5, 'vvl_value' => -5];
		$v->attributes['values'][] = ['vvl_id' => 6, 'vvl_value' => -1];
		$v->attributes['values'][] = ['vvl_id' => 7, 'vvl_value' => 1];
		$v->attributes['values'][] = ['vvl_id' => 8, 'vvl_value' => 5];
		$v->attributes['values'][] = ['vvl_id' => 9, 'vvl_value' => 10];
		$v->attributes['values'][] = ['vvl_id' => 10, 'vvl_value' => 20];
		$v->attributes['values'][] = ['vvl_id' => 11, 'vvl_value' => 50];
		$v->attributes['values'][] = ['vvl_id' => 12, 'vvl_value' => 10000000];

		$valueSelector = $v->CalculateVersionValueLabelId($value);
		$columns[] = ['sna_' . $variable1->Id() . '_' . $variable2->Id() . '_value_label_id', 'int(11) NOT NULL', $valueSelector];


		// Se fija si precisa traer el valor de una secuencia
		if ($variable1->IsSequence())
		{
			$columns[] = ['sna_' . $variable1->Id() . '_sequence_value', "double NOT NULL DEFAULT '0'", 't1.' . 'sna_' . $variable1->Id() . '_sequence_value'];
			$columns[] = ['sna_' . $variable1->Id() . '_sequence_order', "int NOT NULL DEFAULT '0'", 't1.' . 'sna_' . $variable1->Id() . '_sequence_order'];
		}
	}

	private function CalculateNormalizedValueField($variable, $tablePreffix = '')
	{
		$field = $tablePreffix . 'sna_' . $variable->Id() . '_value';
		if ($variable->attributes['mvv_normalization'] == SpecialColumnEnum::NullValue)
			return $field;

		$normalizationField = $tablePreffix . 'sna_' . $variable->Id() . '_total';
		return "(CASE WHEN " . $normalizationField . " IS NULL THEN NULL "
					. "WHEN " . $normalizationField . " = 0 THEN 0 "
					. "ELSE " . $field . " * " . $variable->attributes['mvv_normalization_scale'] . " / " . $normalizationField . " END " . ") ";
	}
}
