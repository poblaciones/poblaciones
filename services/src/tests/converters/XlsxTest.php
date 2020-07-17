<?php declare(strict_types=1);

namespace helena\tests\converters;

use helena\classes\TestCase;
use helena\classes\Paths;
use minga\framework\IO;
use helena\classes\writers\XlsxWriter;

class XlsxTest extends TestCase
{
	public function testCsvToExcel()
	{
		$spssData = Paths::GetTestsDataLocalPath() . '/testRadios.csv';
		$outSta = IO::GetTempFilename();

		XlsxWriter::CsvToExcel($spssData, $outSta);
		// no poner tamaño porque el excel resultante varía en tamaño entre cada corrida
		$this->assertFile($outSta);
	}
}
