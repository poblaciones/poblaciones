<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\CsvReader;
use helena\classes\Paths;
use helena\classes\TestCase;
use minga\framework\IO;

class XlsxReaderTest extends TestCase
{
	public function testReadFile()
	{
		$tester = new GenericReaderTester($this);

		$file = Paths::GetTestsDataLocalPath() . '/testBibliotecas.xlsx';
		$tester->testReadFile($file, 'bibliotecas de la ciudad acá', 7232, 1519);

		$file = Paths::GetTestsDataLocalPath() . '/testLibros.xls';
		$tester->testReadFile($file, 'Sheet1', 6120, 224591);
	}
}