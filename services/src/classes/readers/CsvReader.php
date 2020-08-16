<?php

namespace helena\classes\readers;

use helena\classes\CsvToJson;

class CsvReader extends BaseReader
{
	public function WriteJson($selectedSheetIndex)
	{
		CsvToJson::Convert($this->sourceFile, $this->folder);
	}

}

