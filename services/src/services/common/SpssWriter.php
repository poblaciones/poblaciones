<?php

namespace helena\services\common;

use minga\framework\IO;
use minga\framework\Log;
use minga\framework\ErrorException;
use minga\framework\Str;
use minga\framework\System;
use helena\classes\Paths;
use helena\classes\spss\Alignment;
use helena\classes\spss\Variable;
use helena\classes\spss\Format;
use helena\classes\spss\Measurement;

use helena\classes\App;

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

		$hFile = $this->state->Get('outFile') . '_head.json';
		IO::WriteJson($hFile, $head, true);

		$lines = array();

		$python = App::GetPython3Path();
		$p3 = '3';
		if($python == null)
		{
			$python = App::GetPythonPath();
			$p3 = '';
		}


		$ret = System::Execute($python, array(
			Paths::GetPythonScriptsPath() . '/json2spss' . $p3 . '.py',
			$hFile,
			$this->state->Get('dFile'),
			$this->state->Get('outFile'),
		), $lines);

		if($ret !== 0)
		{
			$err = '';
			$detail = "\nHeader: " . $hFile
				. "\nData: " . $this->state->Get('dFile') . ' (' . $this->state->Get('index') . ')'
				. "\n" . implode("\n", $lines);
			if(App::Debug())
				$err = $detail;
			else
				Log::HandleSilentException(new ErrorException($detail));

			throw new ErrorException('Error en creación de archivo spss.' . $err);
		}
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

