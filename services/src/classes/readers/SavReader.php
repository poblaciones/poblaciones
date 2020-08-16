<?php

namespace helena\classes\readers;

use helena\classes\Python;


class SavReader extends BaseReader
{
	public function WriteJson($selectedSheetIndex)
	{
		$args = [$this->sourceFile, $this->folder];

		Python::Execute('spss2json3.py', $args);
	}
}

