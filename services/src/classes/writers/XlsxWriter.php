<?php

namespace helena\classes\writers;

use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Writer\XLSX\Writer as XlsxSpoutWriter;
use OpenSpout\Writer\XLSX\Options as XlsxOptions;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
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
			$options = new XlsxOptions();
			$options->setTempFolder(Context::Paths()->GetTempPath());
			$writer = new XlsxSpoutWriter($options);

			$reader = new CsvReader();
			$reader->open($fileCsv);
			$writer->openToFile($fileExcel);

			$writer->getCurrentSheet()->setSheetView(
            (new SheetView())
                ->setZoomScale(90)
                ->setZoomScaleNormal(90)
                ->setZoomScalePageLayoutView(90)
                ->setFreezeRow(2)
        );

			$style = (new Style())->setBackgroundColor(Color::rgb(217, 217, 217));

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
								$outCells[] = Cell::fromValue($val);
								$col++;
							}
							if ($firstRow)
								$singleRow = new Row($outCells, $style);
							else
								$singleRow = new Row($outCells);

							$writer->addRow($singleRow);
							$firstRow = false;
					}
			}


			$reader->close();

			$writer->close();
	}
}

