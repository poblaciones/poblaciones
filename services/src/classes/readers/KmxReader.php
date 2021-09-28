<?php

namespace helena\classes\readers;

use helena\classes\Python;
use minga\framework\IO;

class KmxReader extends CsvReader
{
	public function Prepare($selectedSheetIndex)
	{
		$intermediateFile = $this->PrepareIntermediateFile();

		$args = array($this->extension, $intermediateFile, $this->folder, 'true', $selectedSheetIndex);
		Python::Execute('kmx2csv3.py', $args);

		IO::Copy($intermediateFile . '_out.csv', $this->sourceFile);
	}

	public function CanGeoreference()
	{
		return 2;
	}

	public function ReadSheetNames()
	{
		$intermediateFile = $this->PrepareIntermediateFile();
		$args = array($this->extension, $intermediateFile, $this->folder, 'false');
		Python::Execute('kmx2csv3.py', $args);

		$outFile = $intermediateFile . '_folders.txt';
		$lines = IO::ReadAllLines($outFile);

		$ret = [];
		$n = 1;
		foreach($lines as $line)
		{
			$ret[] = ['Id' => $n, 'Caption' => $line];
			$n++;
		}

		return $ret;
	}
}

