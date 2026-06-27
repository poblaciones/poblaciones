<?php

namespace helena\services\backoffice\publish\snapshots;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\Profiling;
use minga\framework\PublicException;
use helena\classes\DatasetTypeEnum;
use helena\classes\spss\Format;
use helena\classes\SpecialColumnEnum;
use helena\classes\App;

use helena\services\backoffice\DatasetColumnService;

class Variable
{
	public $attributes;
	private $metricVersionLevel;

	public const VALID_OPERATORS = ["=", "<>", ">", ">=", "<", "<=", "IS NULL", "IS NOT NULL", "LIKE", "NOT LIKE"];

	public function __construct($metricVersionLevel, $row)
	{
		$this->metricVersionLevel = $metricVersionLevel;
		$this->attributes = $row;
	}

	public function Id()
	{
		return $this->attributes["mvv_id"];
	}

	public static function GetVariables($metricVersionLevel)
	{
		Profiling::BeginTimer();

		$metricVersionLevelId = $metricVersionLevel['mvl_id'];
		$sql = "SELECT variable.*,
										vsy_cut_mode,
										vsy_cut_column_id,
										vsy_is_sequence,
										(CASE WHEN vsy_is_sequence THEN vsy_sequence_column_id ELSE NULL END) AS vsy_sequence_column_id,
										(CASE WHEN vsy_is_sequence THEN sequencecolumn.dco_field ELSE NULL END) AS vsy_sequence_field,
										data.dco_field AS mvv_data_field,
										data.dco_variable AS mvv_data_column_variable,
										normalization.dco_field AS mvv_normalization_field,
										normalization.dco_variable AS mvv_normalization_column_variable,
										gap_data.dco_field AS mvv_gap_data_field,
										gap_data.dco_variable AS mvv_gap_data_column_variable,
										gap_normalization.dco_field AS mvv_gap_normalization_field,
										gap_normalization.dco_variable AS mvv_gap_normalization_column_variable,
										cutcolumn.dco_format AS mvv_cut_field_format
						FROM variable
						JOIN symbology ON mvv_symbology_id = vsy_id
						LEFT JOIN dataset_column data ON data.dco_id = mvv_data_column_id
						LEFT JOIN dataset_column normalization ON normalization.dco_id = mvv_normalization_column_id
						LEFT JOIN dataset_column gap_data ON gap_data.dco_id = mvv_gap_data_column_id
						LEFT JOIN dataset_column gap_normalization ON gap_normalization.dco_id = mvv_gap_normalization_column_id
						LEFT JOIN dataset_column sequencecolumn ON sequencecolumn.dco_id = vsy_sequence_column_id
						LEFT JOIN dataset_column cutcolumn ON cutcolumn.dco_id = vsy_cut_column_id
						WHERE mvv_metric_version_level_id = ? ORDER BY mvv_order";
		$rows = App::Db()->fetchAll($sql, array($metricVersionLevelId));
		self::AddLabels($rows, $metricVersionLevelId);
		$ret = array();
		foreach($rows as $row)
			$ret[] = new Variable($metricVersionLevel, $row);
		Profiling::EndTimer();
		return $ret;
	}
	private static function AddLabels(&$variables, $metricVersionLevelId)
	{
	  // Genera una colección indexada de Labels por Level
		$sql = "SELECT mvv_id, variable_value_label.*
						FROM variable
						JOIN variable_value_label ON mvv_id = vvl_variable_id
						WHERE mvv_metric_version_level_id = ? ORDER BY mvv_id, vvl_order";
		$values = App::Db()->fetchAll($sql, array($metricVersionLevelId));
		$valueDictionary = Arr::FromSortedToKeyed($values, 'mvv_id');
		// Asigna niveles a variables
		foreach($variables as &$variable)
		{
			$values = Arr::SafeGet($valueDictionary, $variable['mvv_id'], array());
			$variable['values'] = $values;
		}
	}

	public function IsGap()
	{
		return $this->attributes['mvv_is_gap'];
	}
	public function CalculateValueField($preffix = "")
	{
		if ($this->attributes['mvv_data_column_is_categorical'])
			return 1;

		$field = self::GetRichColumn($this->attributes, "mvv" . $preffix . "_data", $this->metricVersionLevel['dat_type']);

		if ($this->attributes["mvv" . $preffix . "_normalization"] == SpecialColumnEnum::NullValue)
			return $field;

		$normalizationField = self::GetRichColumn($this->attributes, "mvv" . $preffix . "_normalization", $this->metricVersionLevel['dat_type']);
		if ($normalizationField == 'null')
			return $field;
		else
			return "(CASE "
								. "WHEN " . $normalizationField . " IS NULL"
								. " THEN NULL "
								. "ELSE " . $field . " END) ";
	}

	public function CalculateNormalizationField($preffix = "")
	{
		if ($this->attributes['mvv' . $preffix . '_normalization'] == SpecialColumnEnum::NullValue)
			return 0;
		else
			return self::GetRichColumn($this->attributes, "mvv" . $preffix . "_normalization", $this->metricVersionLevel['dat_type']);
	}

	private function RaiseError($problem)
	{
		throw new PublicException("Hay un problema con la variable '" . $this->attributes['mvv_caption']. "' de "
					. $this->GetVariableMetricErrorCaption() . ". " . $problem);
	}

	public function CalculateFilterCondition($datasetId)
	{
		try
		{
			$filter = $this->attributes['mvv_filter_value'];
			return self::ResolveFilterCondition($datasetId, $filter);
		}
		catch(\Exception $e)
		{
			$this->RaiseError($e->getMessage());
		}
	}
	private static function ValidateOperator($operator)
	{
		foreach(self::VALID_OPERATORS as $op)
			if ($op === $operator)
			 return;
		throw new PublicException("Operador inválido: " . $operator);
	}

	public function IsValidFormula()
	{
		return !($this->attributes['mvv_data'] == 'O' && $this->attributes['mvv_data_column_id'] == null);
	}

	public static function ResolveFilterCondition($datasetId, $filter)
	{
		$filterParts = explode("\t", $filter);
		// el primero es sí o sí una columna... la resuelve
		$variable = $filterParts[0];
		$datasetColumnService = new DatasetColumnService();
		$column = $datasetColumnService->GetColumnByVariable($datasetId, $variable);
		if ($column === null)
			throw new PublicException("La variable '" . $variable . "' indicada como filtro ya no existe en el dataset. Deberá revisar el filtro para poder continuar.");
		$field = $column->getField();
		$sql = "(" . $field;

		// el segundo es un operador... va literal
		$operator = $filterParts[1];
		self::ValidateOperator($operator);
		$sql .= " " . $operator;

		if ($operator == "IS NULL")
			$sql .= " OR " . $field . " = ''";
		else if ($operator == "IS NOT NULL")
			$sql .= " AND " . $field . " <> ''";

		if ($operator == "IS NULL" OR $operator == "IS NOT NULL")
			return $sql . ")";

		// el tercero es el valor a comparar
		$value = $filterParts[2];
		if (Str::StartsWith($value, "["))
		{
			// Variable
			$variableName = substr($value, 1, strlen($value) - 2);
			$column = $datasetColumnService->GetColumnByVariable($datasetId, $variableName);
			if ($column === null)
				throw new PublicException("La variable '" . $variableName . "' indicada como valor del filtro ya no existe en el dataset. Deberá revisar el filtro para poder continuar.");
			$sqlValue = $column->getField();
		}
		else if (Str::StartsWith($value, "'"))
		{	// Texto
			if (!Str::EndsWith($value, "'"))
				throw new PublicException("Los valores de texto indicados como criterio de filtro que comienzan con comillas simples y deben finalizar con comillas simples.");
			$sqlValue = "'" . Str::Replace(substr($value, 1, strlen($value) - 2), "'", "\'") . "'";
		}
		else if (Str::StartsWith($value, '"'))
		{ // Texto
			if (!Str::EndsWith($value, '"'))
				throw new PublicException("Los valores de texto indicados como criterio de filtro que comienzan con comillas dobles deben finalizar con comilla dobles.");
			$sqlValue = '"' . Str::Replace(substr($value, 1, strlen($value) - 2), '"', '\"') . '"';
		}
		else
		{ // Número
			$value = Str::Replace($value, ",", ".");
			if (!Str::IsNumber($value))
				throw new PublicException("El valor indicado no es un número válido. Si desea indicar un texto, añada comillas al inicio y al final del mismo.");
			$sqlValue = "" . floatval($value);
		}

		if ($operator === 'LIKE' || $operator === 'NOT LIKE')
		{
			$sql .= "CONCAT('%'," . $sqlValue . ", '%')";
		}
		else
		{
			$sql .= $sqlValue;
		}
		return $sql . ")";
	}

	public function HasFilters()
	{
		return ($this->attributes['mvv_filter_value'] !== null);
	}

	public function IsSequence()
	{
		return ($this->attributes['vsy_is_sequence']);
	}
	public function SequenceField()
	{
		return ($this->attributes['vsy_sequence_field']);
	}

	public function CalculateSegmentationValueField()
	{
		$cutMode = $this->attributes['vsy_cut_mode'];
		if ($cutMode === 'V')
		{
			$cutColumnId = $this->attributes['vsy_cut_column_id'];
			if ($cutColumnId === null)
			{
				$this->RaiseError("no tiene una variable de segmentación definida. Revise la simbología de la variable.");
			}
			return $this->GetFieldFromId($cutColumnId);
		}
		else
			return $this->CalculateNormalizedFinalValueField();
	}

	private function GetFieldFromId($columnId)
	{
		// Obtiene el campo para la variable
		$params = array($columnId);
		$sql = "SELECT dco_field FROM dataset_column where dco_id = ? LIMIT 1";
		$ret = App::Db()->fetchScalar($sql, $params);
		return $ret;
	}


	public function CalculateNormalizedFinalValueField($fixDecimales = -1)
	{
		$value1 = $this->CalculateNormalizedValueField();
		if ($this->IsGap())
		{
			$value2 = $this->CalculateNormalizedValueField("_gap");
			$isPercentage = ($this->attributes['mvv_normalization'] !== SpecialColumnEnum::NullValue && $this->attributes['mvv_normalization_scale'] == 100);
			if ($isPercentage)
				$valueSql = "(" . $value2 . " - " . $value1 . ")";
			else
				$valueSql = "((" . $value2 . " / " . $value1 . " - 1) * 100)";
		}
		else
		{
			$valueSql = $value1;
		}

		if ($fixDecimales !== -1) {
			return "ROUND(" . $valueSql . "," . $fixDecimales . ")";
		} else {
			return $valueSql;
		}
	}

	public function CalculateNormalizedValueField($suffix = "")
	{
		$field = self::GetRichColumn($this->attributes, "mvv" . $suffix . "_data", $this->metricVersionLevel['dat_type']);
		if ($this->attributes['mvv_normalization'] == SpecialColumnEnum::NullValue)
			return $field;

		$normalizationField = self::GetRichColumn($this->attributes, "mvv" . $suffix . "_normalization", $this->metricVersionLevel['dat_type']);
		if ($normalizationField == 'null')
			return $field;
		else
			return "(CASE "
								. "WHEN " . $normalizationField . " IS NULL"
								. " THEN NULL "
								. "ELSE " . $field . " * " . $this->attributes['mvv_normalization_scale'] . " / " . $normalizationField . " END " . ") ";
	}

	public function CalculateVersionValueLabelId($valueField)
	{
		$values = $this->attributes['values'];
		if (sizeof($values) == 0)
			throw new PublicException("La variable '" . $this->attributes['mvv_caption']. "' del indicador "
				. $this->GetVariableMetricErrorCaption() . " no tiene valores. Revise la simbología de la variable y vuelva a intentar publicar.");

		if (sizeof($values) == 1 && $values[0]['vvl_value'] == null)
			return $values[0]['vvl_id'];

		$cutMode = $this->attributes['vsy_cut_mode'];
		switch($cutMode) {
			case 'S':
				$firstItem = $values[0];
				return $firstItem['vvl_id'];
			case 'V':
				if ($this->attributes['mvv_cut_field_format'] === Format::A)
				{	// Los de tipo texto los igual por contenido
					$sql = "(SELECT vvl_id from variable_value_label
					     where vvl_variable_id = " . $this->attributes['mvv_id']
					  . " and ((vvl_value IS NULL AND NULLIF(" . $valueField . ", '') IS NULL) OR
									   (vvl_value IS NOT NULL AND vvl_caption <=> " . $valueField . ")))";
				}
				else
				{	// Los numéricos (con etiqueta) los iguales por valor
					$sql = "(SELECT vvl_id from variable_value_label
					     where vvl_variable_id = " . $this->attributes['mvv_id']
					  . " and vvl_value <=> " . $valueField . ")";
				}
				return $sql;
			case 'J':
			case 'T':
			case 'M':
				// son rangos
				$first = true;
				$paletteCase = "(CASE ";
				$errors = "";
				for ($n = 0; $n < sizeof($values); $n++)
				{
					$item = $values[$n];
					if ($item['vvl_value'] === null || $item['vvl_value'] === "")
					{
						if (!$first)
							throw new PublicException("El elemento para los 'sin valores' debe estar ubicado en el primer lugar.");
						// es el que toma los nulos
						$paletteCase .= " WHEN " . $valueField . " IS NULL";
					}
					else if ($first)
					{	// es el primero
						$first = false;
						$paletteCase .= " WHEN " . $valueField . " < " . $item['vvl_value'];
					}
					else if ($n === sizeof($values) - 1)
					{	// es el último
						$prevItem = $values[$n - 1];
						$paletteCase .= " WHEN " . $valueField . " >= " . $prevItem['vvl_value'];
					}
					else
					{ // es un ítem de la escala
						$prevItem = $values[$n - 1];
						if ($prevItem['vvl_value'] === null || $prevItem['vvl_value'] === "")
						{
							$errors .= "- La variable '" . $this->attributes['mvv_caption'] . "' de "
								. $this->GetVariableMetricErrorCaption() .
								" no tiene definidos correctamente sus valores. Revise la simbología de la variable y vuelva a intentar publicar.\n\n";
						}
						$paletteCase .= " WHEN " . $valueField . " BETWEEN " .
														$prevItem['vvl_value'] . " AND " . ($item['vvl_value'] - 0.000001);
					}
					$paletteCase .= " THEN " . $item['vvl_id'];
				}
				if (strlen($errors) > 0)
				{
					throw new PublicException($errors);
				}
				$paletteCase .= " ELSE NULL END) ";
				return $paletteCase;
			default:
				throw new \Exception('El tipo de segmentación no fue reconocido: ' . $cutMode);
		}
	}
	public static function HasGeoFields($dataColumn, $normalization)
	{
		return  ($dataColumn !== SpecialColumnEnum::NullValue &&
						$dataColumn !== SpecialColumnEnum::Other) ||
						($normalization !== SpecialColumnEnum::NullValue &&
						$normalization !== SpecialColumnEnum::Other);
	}

	public static function GetRichColumnVariable($col, $fieldVariable)
	{
		$specialColumnEnum = $col;
		if ($specialColumnEnum == SpecialColumnEnum::NullValue)
			return '';
		else if ($specialColumnEnum == SpecialColumnEnum::Other)
		{
	      return $fieldVariable;
		}
		else
			return "[" . self::SpecialColumnToLabel($specialColumnEnum) . "]";
	}

	public static function GetRichColumnCaption($col, $fieldLabel)
	{
		$specialColumnEnum = $col;
		if ($specialColumnEnum == SpecialColumnEnum::NullValue)
			return '';
		else if ($specialColumnEnum == SpecialColumnEnum::Other)
		{
      return $fieldLabel;
		}
		else
			return self::SpecialColumnToLabel($specialColumnEnum);
	}

	public static function SpecialColumnToLabel($dc)
	{
		$label = null;
		switch ($dc)
		{
			case SpecialColumnEnum::Adult:
				$label = "Adultos (>=18)";
				break;
			case SpecialColumnEnum::AreaM2:
				$label = "Área m²";
				break;
			case SpecialColumnEnum::AreaKm2:
				$label = "Área km²";
				break;
			case SpecialColumnEnum::Children:
				$label = "Niños (<18)";
				break;
			case SpecialColumnEnum::Household:
				$label = "Hogares";
				break;
			case SpecialColumnEnum::People:
				$label = "Población total";
				break;
			case SpecialColumnEnum::Count:
				$label = "Conteo";
				break;
			default:
				throw new PublicException("La columna indicada no pertenece a la tabla de geografía.");
		}
		return $label;
	}
	public static function FormulaToString($variable)
	{
		$unit = "";
		$hasNormalization = ($variable['mvv_normalization'] !== SpecialColumnEnum::NullValue);
		if ($hasNormalization) {
			switch ($variable['mvv_normalization_scale']) {
				case 1:
					$unit = "n cada unidad";
					break;
				case 100:
					$unit = "porcentaje";
					break;
				case 1000:
					$unit = "n cada mil";
					break;
				case 10000:
					$unit = "n cada 10 mil";
					break;
				case 100000:
					$unit = "n cada 100 mil";
					break;
				case 1000000:
					$unit = "n cada 1 millón";
					break;
			}
		}
		if ($variable['mvv_is_gap'])
		{
			$hasNormalization = ($variable['mvv_normalization'] !== SpecialColumnEnum::NullValue);
			$term1 = self::formulaTermToString($variable, 'mvv_data', 'mvv_normalization');
			$term2 = self::formulaTermToString($variable, 'mvv_gap_data', 'mvv_gap_normalization');
			if ($hasNormalization && $variable['mvv_normalization_scale'] == 100)
			{
				return "(" . $term2 . ") - (" . $term1 . ") (brecha de " . $unit . " en pp.)";
			}
			else
			{
				if ($unit != '')
					$unit = " de " . $unit;
				return "((" . $term2 . ") / (" . $term1 . ") - 1) * 100 (brecha porcentual" . $unit . ")";
			}
		}
		else
		{
			if ($unit != "")
				$unit = " (" . $unit . ")";
			return self::formulaTermToString($variable, 'mvv_data', 'mvv_normalization') . $unit;
		}
	}
	private static function formulaTermToString($variable, $data_field, $normalization_field)
	{
		if ($variable['mvv_data_column_is_categorical'])
			$dataVariable = '[' . self::SpecialColumnToLabel(SpecialColumnEnum::Count) . ']';
		else
			$dataVariable = self::GetRichColumnVariable($variable[$data_field], $variable[$data_field . '_column_variable']);

		$normalizationVariable = self::GetRichColumnVariable($variable[$normalization_field], $variable[$normalization_field . '_column_variable']);
		$ret = $dataVariable;
		if ($normalizationVariable)
		{
			switch($variable['mvv_normalization_scale'])
			{
				case 1:
					$ret .= " / " . $normalizationVariable;
					break;
				case 100:
					$ret .= " / " . $normalizationVariable . " * 100";
					break;
				case 1000:
					$ret .= " / " . $normalizationVariable . " / 1000";
					break;
				case 10000:
					$ret .= " / " . $normalizationVariable . " / 10.000";
					break;
				case 100000:
					$ret .= " / " . $normalizationVariable . " / 100.000";
					break;
				case 1000000:
					$ret .= " / " . $normalizationVariable . " / 1.000.000";
					break;
			}
		}
		return $ret;
	}

	public static function GetRichColumn($col, $field, $datatasetType)
	{
		$specialColumnEnum = $col[$field];
		if ($specialColumnEnum == SpecialColumnEnum::NullValue)
			return 'null';
		else if ($specialColumnEnum == SpecialColumnEnum::Other)
		{
      return "`" . $col[$field . "_field"] . "`";
		}
		else
			return self::SpecialColumnToField($specialColumnEnum, $datatasetType);
	}

	public static function SpecialColumnToField($dc, $datatasetType, $areSegments = false)
	{
		$field = null;
		switch ($dc)
		{
			case SpecialColumnEnum::Adult:
				$field = "gei_population - gei_children";
				break;
			case SpecialColumnEnum::AreaM2:
				if ($areSegments)
					return 0;
				else if ($datatasetType == DatasetTypeEnum::Shapes)
					$field = "area_m2";
				else
					$field = "gei_area_m2";
				break;
			case SpecialColumnEnum::AreaKm2:
				if ($areSegments)
					return 0;
				else if ($datatasetType == DatasetTypeEnum::Shapes)
					$field = "(area_m2 / 1000000)";
				else
					$field = "(gei_area_m2 / 1000000)";
				break;
			case SpecialColumnEnum::Children:
				$field = "gei_children";
				break;
			case SpecialColumnEnum::Household:
				$field = "gei_households";
				break;
			case SpecialColumnEnum::People:
				$field = "gei_population";
				break;
			case SpecialColumnEnum::Count:
				$field = "n";
				break;
			default:
				throw new PublicException("La columna indicada no pertenece a la tabla de geografía.");
		}
		return $field;
	}
	private function GetVariableMetricErrorCaption()
	{
		$sql = "SELECT mvr_caption, mtr_caption, geo_caption, dat_caption
					FROM variable
					JOIN metric_version_level ON mvv_metric_version_level_id = mvl_id
					JOIN metric_version ON mvl_metric_version_id = mvr_id
					JOIN metric ON mvr_metric_id = mtr_id
					LEFT JOIN dataset ON mvl_dataset_id = dat_id
					LEFT JOIN geography ON geo_id = dat_geography_id
						WHERE mvv_id = ? LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, array($this->attributes['mvv_id']));
		return  "'" . $ret['mtr_caption'] . "' del dataset '" . $ret['dat_caption'] . "' en la revisión " . $ret['mvr_caption'];
	}
}
