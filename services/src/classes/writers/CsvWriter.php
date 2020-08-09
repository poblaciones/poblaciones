<?php

namespace helena\classes\writers;

use minga\framework\PublicException;
use minga\framework\Str;

use helena\classes\spss\Format;

class CsvWriter extends BaseWriter
{
	static $OUTPUT_LATIN3_WINDOWS_ISO = false;

	public function SaveHeader()
	{
		$file = fopen($this->state->Get('outFile'), 'a');
		if($file === false)
			throw new PublicException('Error en creación de archivo');

		$count = count($this->state->Cols());

		$labels = $this->writeCSVheader($file, $count);

		$this->state->Set('labels', $labels);
		fclose($file);
	}

	public function PageData()
	{
		$rows = $this->GetRowsAndIncrementSlice();

		if(count($rows) === 0) return false;

		$file = fopen($this->state->Get('outFile'), 'a');
		if($file === false)
			throw new PublicException('Error en creación de archivo');
		$cols = $this->state->Cols();
		$count = count($cols);

		foreach($rows as $row)
		{
			$rowText = '';
			$c = 0;
			foreach($row as $k => $value)
			{
				if($this->model->wktIndex == $k)
					$value = $this->PrepareGeometry($this->state->Get('type'), $value);
				$isNumericColumn = $cols[$c]['format'] == Format::F;
				if($isNumericColumn)
				{
					if (Str::Contains($value, '.'))
					{
						$value = rtrim($value, '0');
						$value = rtrim($value, '.');
					}
				}
				$text = $this->GetCSVField($k, $value, $isNumericColumn, $this->state->Get('labels'), ($k + 1 == $count));
				$text = $this->MakeOutputEncoding($text);

				$rowText .= $text;
				$c++;
			}
			if(fwrite($file, $rowText) === false)
				throw new PublicException('Error en creación de archivo');
		}
		fclose($file);

		return true;
	}

	public function Flush()
	{
	}

	private function MakeOutputEncoding($utf8text)
	{
		if (self::$OUTPUT_LATIN3_WINDOWS_ISO)
			return mb_convert_encoding($utf8text, 'ISO-8859-1', 'UTF-8');
		else
			return $utf8text;
	}

	private function writeCSVheader($file, $count)
	{
		$labels = array();
		foreach($this->state->Cols() as $k => $col)
		{
			$text = $this->FormatCSVField($col['caption'], ($k + 1 == $count));
			$text = $this->MakeOutputEncoding($text);
			if(fwrite($file, $text) === false)
				throw new PublicException('Error en creación de archivo');

			$res = $this->GetValueLabels($col);
			if(count($res) > 0)
				$labels[$k] = $res;
		}
		return $labels;
	}

	private function GetCSVField($k, $value, $isNumericColumn, $labels, $last)
	{
		if(isset($labels[$k][$value]))
			return $this->FormatCSVField($labels[$k][$value], $last, false);
		else
			return $this->FormatCSVField($value, $last, $isNumericColumn);
	}

	private function FormatCSVField($value, $last = false, $isNumericColumn = false)
	{
		$end = ',';
		if($last)
			$end = "\r\n";

		if ($isNumericColumn)
			return $value . $end;
		else
			return '"' . str_replace('"', '""', $value) . '"' . $end;
	}

}

