<?php

namespace helena\classes\readers;

use helena\classes\CsvToJson;

class CsvReader extends BaseReader
{
	public function WriteJson($sheetName)
	{
		CsvToJson::Convert($this->sourceFile, $this->folder);
	}

}

