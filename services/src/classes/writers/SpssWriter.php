<?php

namespace helena\classes\writers;

use minga\framework\IO;
use helena\classes\spss\Alignment;
use helena\classes\spss\Variable;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;

use helena\classes\Python;

class SpssWriter extends JsonWriter
{
	public function Flush()
	{
		// Creo el archivo de datos vacío por consistencia de SafeName con hFile.
		touch($this->state->Get('dFile'));

		$head = array();
		foreach($this->state->Cols() as $col)
			$head = $this->ProcessColumn($col, $head);

		// Si no tiene value labels crea el valor vacío para que esté en el json para python.
		if(isset($head['valueLabels']) == false)
			$head['valueLabels'] = new \stdClass();

		$headerFile = $this->state->Get('outFile') . '_head.json';
		IO::WriteJson($headerFile, $head, true);

		$args = array($headerFile, $this->state->Get('dFile'), $this->state->Get('outFile'));
		Python::Execute('json2spss3.py', $args);
	}

	private function ProcessColumn(array $col, array $head)
	{
		$col['variable'] = Variable::FixName($col['variable']);

		$head['varNames'][] = $col['variable'];

		$labels = $this->GetValueLabels($col);
		if(count($labels) > 0)
			$head['valueLabels'][$col['variable']] = $labels;

		$head['varFormats'][$col['variable']] = Format::GetName($col['format']).$col['field_width'];

		if($col['format'] == Format::F)
		{
			$head['varTypes'][$col['variable']] = 0;
			$head['varFormats'][$col['variable']] .= '.'.$col['decimals'];
		}
		else
			$head['varTypes'][$col['variable']] = (int)$col['field_width'];

		$head['varLabels'][$col['variable']] = $col['caption'];

		$head['measureLevels'][$col['variable']] = Measurement::GetName($col['measure']);
		$head['columnWidths'][$col['variable']] = (int)$col['column_width'];
		$head['alignments'][$col['variable']] = Alignment::GetName($col['align']);

		return $head;
	}
}

