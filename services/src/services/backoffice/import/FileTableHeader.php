<?php

namespace helena\services\backoffice\import;
use helena\classes\spss\Format;

class FileTableHeader
{
	private $variable;
	private $field;
	private $spssType;
	private $labels;
	private $sqlType;
	private $columnWidth;
	private $fieldWidth;
	private $label;
	private $measureLevels;
	private $alignment;
	private $decimals;

	function __construct($variable, $field, $sqlType, $spssType = null, $fieldWidth = null, $columnWidth = null, $label = null, $measureLevels = null, $alignment = null, $decimals = null) {
     $this->variable = $variable;
	   $this->field = $field;
	   $this->spssType = $spssType;
	   $this->sqlType = $sqlType;
	   $this->columnWidth = $columnWidth;
	   $this->fieldWidth = $fieldWidth;
	   $this->label = $label;
	   $this->measureLevels = $measureLevels;
	   $this->alignment = $alignment;
	   $this->decimals = $decimals;
	   $this->labels = [];
   }

	public function GetDecimals(){
		return $this->decimals;
	}

	public function GetColumnWidth(){
		return $this->columnWidth;
	}

	public function GetFieldWidth(){
		return $this->fieldWidth;
	}

	public function GetLabel(){
		return $this->label;
	}

	public function GetMeasureLevels(){
		return $this->measureLevels;
	}

	public function GetAlignment(){
		return $this->alignment;
	}

	public function GetVariable(){
		return $this->variable;
	}

	public function GetField(){
		return $this->field;
	}
	public function IsNumeric(){
		return $this->spssType !== Format::A;
	}

	public function GetSpssType(){
		return $this->spssType;
	}

	public function GetSqlType(){
		return $this->sqlType;
	}

	public function AddLabelValues($values)
	{
		$this->labels = $values;
	}

	public function GetLabelValues()
	{
		return $this->labels;
	}
}

