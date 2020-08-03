<?php

namespace helena\classes\readers;

use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\IOFactory;

use minga\framework\ErrorException;

use helena\services\backoffice\import\PhpSpreadSheetCsv;

class XlsxReader extends CsvReader
{
	public function Prepare($sheetName)
	{
		$intermediateFile = $this->PrepareIntermediateFile();

		$spreadsheet = IOFactory::load($intermediateFile);
		$loadedSheetNames = $spreadsheet->getSheetNames();
		$writer = new PhpSpreadSheetCsv($spreadsheet);

		foreach($loadedSheetNames as $sheetIndex => $loadedSheetName)
		{
			if ($sheetName === $loadedSheetName)
			{
				$writer->setSheetIndex($sheetIndex);
				$writer->save($this->sourceFile);
				return;
			}
		}
		throw new ErrorException('La hoja indicada no fue encontrada.');
	}

	public function ReadSheetNames()
	{
		$intermediateFile = $this->PrepareIntermediateFile();

		$spreadsheet = IOFactory::load($intermediateFile);
		$loadedSheetNames = $spreadsheet->getSheetNames();
		$ret = [];
		foreach($loadedSheetNames as $sheetIndex => $loadedSheetName)
		{
			$ret[] = $loadedSheetName;
		}
		return $ret;
	}
}

