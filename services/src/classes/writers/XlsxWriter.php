<?php

namespace helena\classes\writers;

use OpenSpout\Reader\Common\Creator\ReaderEntityFactory;
use OpenSpout\Writer\Common\Creator\WriterEntityFactory;
use OpenSpout\Writer\Common\Creator\Style\StyleBuilder;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Writer\XLSX\Entity\SheetView;

use helena\classes\spss\Format;

use minga\framework\Context;
use minga\framework\IO;

class XlsxWriter extends CsvWriter
{
	public function Flush()
	{
		$file = $this->state->Get('outFile');
		$csv = $file . '.csv';
		IO::Move($file, $csv);

		$this->CsvToExcel($csv, $file, $this->state->Cols());
	}

	public static function CsvToExcel($fileCsv, $fileExcel, $cols = null)
	{
			$writer = WriterEntityFactory::createXLSXWriter();
			$writer->setTempFolder(Context::Paths()->GetTempPath());

			$reader = ReaderEntityFactory::createReaderFromFile($fileCsv);
			$reader->open($fileCsv);
			$writer->openToFile($fileExcel);

			$writer->getCurrentSheet()->setSheetView(
            (new SheetView())
                ->setZoomScale(90)
                ->setZoomScaleNormal(90)
                ->setZoomScalePageLayoutView(90)
                ->setFreezeRow(2)
        );

			$styleBuilder = new StyleBuilder();
			$styleBuilder->setBackgroundColor(Color::rgb(217, 217, 217));
			$style = $styleBuilder->build();

			$firstRow = true;
			foreach ($reader->getSheetIterator() as $sheet)
			{
					foreach ($sheet->getRowIterator() as $row)
					{
							// do stuff with the row
							$cells = $row->getCells();
							$outCells = array();
							$col = 0;
							foreach ($cells as $cell)
							{
								$isNumericColumn = $cols !== null && ($cols[$col]['format'] == Format::F);
								$val = $cell->getValue();
								if ($isNumericColumn && !$firstRow && $val !== null && $val !== '')
									$val += 0;
								else if (strlen($val) > 32767)
									$val = "[TRIMMED]"  . substr($val, 0, 32757);
								$outCells[] = WriterEntityFactory::createCell($val);
								$col++;
							}
							if ($firstRow)
								$singleRow = WriterEntityFactory::createRow($outCells, $style);
							else
								$singleRow = WriterEntityFactory::createRow($outCells);

							$writer->addRow($singleRow);
							$firstRow = false;
					}
			}


			$reader->close();

/*			$values = ['Carl', 'is', 'great!'];
			$rowFromValues = WriterEntityFactory::createRowFromArray($values);*/

			$writer->close();
	}
}

