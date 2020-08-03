<?php

namespace helena\classes\readers;

use helena\classes\Python;
use minga\framework\IO;

class KmxReader extends CsvReader
{
	public function Prepare($sheetName)
	{
		$intermediateFile = $this->PrepareIntermediateFile();

		$args = array($this->extension, $intermediateFile, $this->folder, 'true', $sheetName);
		Python::Execute('kmx2csv3.py', $args);

		IO::Copy($intermediateFile . '_out.csv', $this->sourceFile);
	}

	public function ReadSheetNames()
	{
		$intermediateFile = $this->PrepareIntermediateFile();
		$args = array($this->extension, $intermediateFile, $this->folder, 'false');
		Python::Execute('kmx2csv3.py', $args);

		$outFile = $intermediateFile . '_folders.txt';
		$ret = IO::ReadAllLines($outFile);
		return $ret;
	}
}

