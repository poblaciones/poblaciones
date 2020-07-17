<?php

namespace helena\classes\writers;

use helena\classes\spss\Measurement;
use helena\classes\GeoJson;

class BaseWriter
{
	protected $start = 0.0;

	const MAX_DECIMALS = 6;
	const MAX_ROWS = 5000;

	protected $model;
	protected $state;

	function __construct($model, $state)
	{
		$this->model = $model;
		$this->state = $state;
		$this->start = microtime(true);
	}

	protected function GetRowsAndIncrementSlice()
	{
		$this->state->SetTotalSlices($this->state->Get("totalRows"));
		$start = $this->state->Get('start');
		$this->state->SetSlice($start);
		$rows = $this->model->GetPagedRows($start, self::MAX_ROWS);
		$this->state->Increment('start', self::MAX_ROWS);
		return $rows;
	}

	protected function GetValueLabels($col)
	{
		if($col['measure'] != Measurement::Scale && $col['id'] !== null)
		{
			$ids = array();
			if(isset($col['label_ids']))
				$ids = array_keys($col['label_ids']);
			return $this->model->GetColumnLabels($col['id'], $ids);
		}
		return array();
	}

	protected function PrepareGeometry($type, $value)
	{
		if ($value == null)
			return null;
		if ($type[1] == 'g')
		{
			$geoJson = new GeoJson();
			$jsonArray = $geoJson->GenerateFeatureFromBinary(array('name'=>'', 'value' => $value));
			$value = json_encode($jsonArray['geometry']);
		}
		return $this->RoundWktValue($value);
	}

	protected function RoundWktValue($value)
	{
		// \. = caracter de punto (.)
		// \d = dígito de 0 a 9
		//    {n} = cantidad de ocurrencias n
		// \d* = digitos cantidad de ocurrencias mayor igual a cero
		// [ ,\)] = alguno de los caracteres entre corchetes: espacio, coma o cierra paréntesis
		// Entre paréntesis los grupos para el replace $1, $2 (se borra), $3
		return preg_replace('/(\.\d{'.self::MAX_DECIMALS.'})(\d*)([ ,\)\]])/', '$1$3', $value);
	}
}

