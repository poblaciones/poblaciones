<?php

namespace helena\services\backoffice\publish\snapshots;

use minga\framework\Arr;
use minga\framework\Profiling;
use minga\framework\ErrorException;

use helena\classes\SpecialColumnEnum;
use helena\classes\App;

class Variable
{
	public $attributes;
	private $metricVersionLevel;

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
										data.dco_field AS mvv_data_field,
										normalization.dco_field AS mvv_normalization_field
						FROM variable
						JOIN symbology ON mvv_symbology_id = vsy_id
						LEFT JOIN dataset_column data ON data.dco_id = mvv_data_column_id
						LEFT JOIN dataset_column normalization ON normalization.dco_id = mvv_normalization_column_id
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
	public function CalculateValueField()
	{
		if ($this->attributes['mvv_data_column_is_categorical'])
			return 1;

		$field = self::GetRichColumn($this->attributes, "mvv_data");

		if ($this->attributes['mvv_normalization'] == SpecialColumnEnum::NullValue)
			return $field;

		$normalizationField = self::GetRichColumn($this->attributes, "mvv_normalization");
		if ($normalizationField == 'null')
			return $field;
		else
			return "(CASE "
								. "WHEN " . $normalizationField . " IS NULL"
								. " THEN NULL "
								. "ELSE " . $field . " END) ";
	}
	public function CalculateNormalizationField()
	{
		if ($this->attributes['mvv_normalization'] == SpecialColumnEnum::NullValue)
			return 0;
		else
			return self::GetRichColumn($this->attributes, "mvv_normalization");
	}
	public function CalculateSegmentationValueField()
	{
		$cutMode = $this->attributes['vsy_cut_mode'];
		if ($cutMode === 'V')
		{
			$cutColumnId = $this->attributes['vsy_cut_column_id'];
			if ($cutColumnId === null)
			{
				throw new ErrorException("La variable '" . $this->attributes['mvv_caption']. "' de la métrica "
					. $this->GetVariableMetricErrorCaption() . " no tiene una variable de segmentación definida. Revise la simbología de la variable.");
			}
			return $this->GetFieldFromId($cutColumnId);
		}
		else
			return $this->CalculateNormalizedValueField();
	}

	private function GetFieldFromId($columnId)
	{
		// Obtiene el campo para la variable
		$params = array($columnId);
		$sql = "SELECT dco_field FROM dataset_column where dco_id = ? LIMIT 1";
		$ret = App::Db()->fetchScalar($sql, $params);
		return $ret;
	}

	public function CalculateNormalizedValueField($fixDecimales = -1)
	{
		$field = self::GetRichColumn($this->attributes, "mvv_data");
		if ($this->attributes['mvv_normalization'] == SpecialColumnEnum::NullValue)
			return $field;

		$normalizationField = self::GetRichColumn($this->attributes, "mvv_normalization");
		if ($fixDecimales !== -1)
		{
			$pre = "ROUND(";
			$post = "," . $fixDecimales . ")";
		}
		else
		{
			$pre = "";
			$post = "";
		}
		if ($normalizationField == 'null')
			return $field;
		else
			return "(CASE "
								. "WHEN " . $normalizationField . " IS NULL"
								. " THEN NULL "
								. "ELSE " . $pre . $field . " * " . $this->attributes['mvv_normalization_scale'] . " / " . $normalizationField . $post . " END " . ") ";
	}

	public function CalculateVersionValueLabelId($valueField)
	{
		$values = $this->attributes['values'];
		if (sizeof($values) == 0)
		// TODO Bugfix: if (is_array($values) && sizeof($values) == 0)
			throw new ErrorException("La variable '" . $this->attributes['mvv_caption']. "' de la métrica "
				. $this->GetVariableMetricErrorCaption() . " no tiene valores. Revise la symbología de la variable.");

		if (sizeof($values) == 1 && $values[0]['vvl_value'] == null)
		// TODO Bugfix (is_array($values) && sizeof($values) == 1 && is_array($values[0]['vvl_value']) && sizeof($values[0]['vvl_value']) == null)
			return $values[0]['vvl_id'];

		$cutMode = $this->attributes['vsy_cut_mode'];
		switch($cutMode) {
			case 'S':
				$firstItem = $values[0];
				return $firstItem['vvl_id'];
			case 'V':
				$sql = "(SELECT vvl_id from variable_value_label
					     where vvl_variable_id = " . $this->attributes['mvv_id']
					  . " and vvl_value <=> " . $valueField . ")";
				return $sql;
			case 'J':
			case 'T':
			case 'M':
				// son rangos
				$first = true;
				$paletteCase = "(CASE ";
				for ($n = 0; $n < sizeof($values); $n++)
				{
					$item = $values[$n];
					if ($item['vvl_value'] === null)
					{
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
						$paletteCase .= " WHEN " . $valueField . " BETWEEN " .
														$prevItem['vvl_value'] . " AND " . ($item['vvl_value'] - 0.000001);
					}
					$paletteCase .= " THEN " . $item['vvl_id'];
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
				$label = "Area m2";
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
				throw new ErrorException("La columna indicada no pertenece a la tabla de geografía.");
		}
		return $label;
	}
	public static function FormulaToString($variable)
	{
		if ($variable['mvv_data_column_is_categorical'])
			$dataVariable = '[' . self::SpecialColumnToLabel(SpecialColumnEnum::Count) . ']';
		else
			$dataVariable = self::GetRichColumnVariable($variable['mvv_data'], $variable['mvv_data_column_variable']);

		$normalizationVariable = self::GetRichColumnVariable($variable['mvv_normalization'], $variable['mvv_normalization_column_variable']);

		$ret = $dataVariable;
		if ($normalizationVariable)
		{
			switch($variable['mvv_normalization_scale'])
			{
				case 1:
					$ret .= " / " . $normalizationVariable . " (n cada unidad)";
					break;
				case 100:
					$ret .= " / " . $normalizationVariable . " * 100 (Porcentaje)";
					break;
				case 1000:
					$ret .= " / " . $normalizationVariable . " / 1000 (n cada mil)";
					break;
				case 10000:
					$ret .= " / " . $normalizationVariable . " / 10.000 (n cada 10 mil)";
					break;
				case 100000:
					$ret .= " / " . $normalizationVariable . " / 100.000 (n cada 100 mil)";
					break;
				case 1000000:
					$ret .= " / " . $normalizationVariable . " / 1.000.000 (n cada 1 millón)";
					break;
			}
		}
		return $ret;
	}

	public static function GetRichColumn($col, $field)
	{
		$specialColumnEnum = $col[$field];
		if ($specialColumnEnum == SpecialColumnEnum::NullValue)
			return 'null';
		else if ($specialColumnEnum == SpecialColumnEnum::Other)
		{
      return "`" . $col[$field . "_field"] . "`";
		}
		else
			return self::SpecialColumnToField($specialColumnEnum);
	}

	public static function SpecialColumnToField($dc)
	{
		$field = null;
		switch ($dc)
		{
			case SpecialColumnEnum::Adult:
				$field = "gei_population - gei_children";
				break;
			case SpecialColumnEnum::AreaM2:
				$field = "gei_area_m2";
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
				throw new ErrorException("La columna indicada no pertenece a la tabla de geografía.");
		}
		return $field;
	}
	private function GetVariableMetricErrorCaption()
	{
		$sql = "SELECT mvr_caption, mtr_caption
						FROM variable, metric_version_level, metric_version, metric
						WHERE mvv_metric_version_level_id = mvl_id AND
							mvr_metric_id = mtr_id AND mvl_metric_version_id = mvr_id AND mvv_id = ? LIMIT 1";
		$ret = App::Db()->fetchAssoc($sql, array($this->attributes['mvv_id']));
		return  "'" . $ret['mtr_caption'] . "' en la revisión '" . $ret['mvr_caption'] . "'";
	}
}
