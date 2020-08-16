<?php

namespace helena\classes\readers;

use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\IOFactory;

use minga\framework\PublicException;

use helena\services\backoffice\import\PhpSpreadSheetCsv;

class XlsxReader extends CsvReader
{
	public function Prepare($selectedSheetIndex)
	{
		$intermediateFile = $this->PrepareIntermediateFile();

		$spreadsheet = IOFactory::load($intermediateFile);
		$loadedSheetNames = $spreadsheet->getSheetNames();
		$writer = new PhpSpreadSheetCsv($spreadsheet);

		foreach($loadedSheetNames as $sheetIndex => $loadedSheetName)
		{
			if ((int) $selectedSheetIndex === $sheetIndex)
			{
				$writer->setSheetIndex($sheetIndex);
				$writer->save($this->sourceFile);
				return;
			}
		}
		throw new PublicException('La hoja de planilla indicada no fue encontrada');
	}

	public function ReadSheetNames()
	{
		$intermediateFile = $this->PrepareIntermediateFile();

		$spreadsheet = IOFactory::load($intermediateFile);
		$loadedSheetNames = $spreadsheet->getSheetNames();
		$ret = [];
		foreach($loadedSheetNames as $sheetIndex => $loadedSheetName)
		{
			$ret[] = ['Id' => $sheetIndex, 'Caption' => $loadedSheetName];
		}
		return $ret;
	}
}

