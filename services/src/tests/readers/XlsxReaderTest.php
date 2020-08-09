<?php declare(strict_types=1);

namespace helena\tests\readers;

use helena\classes\Paths;
use helena\classes\TestCase;

class XlsxReaderTest extends ReaderTestBase
{
	public function testReadFile()
	{
		$file = Paths::GetTestsDataLocalPath() . '/testBibliotecas.xlsx';
		$this->readAndCheckFile($file, 'bibliotecas de la ciudad acá', 7232, 1519);

		$file = Paths::GetTestsDataLocalPath() . '/testLibros.xls';
		$this->readAndCheckFile($file, 'Sheet1', 6120, 224591);

		$this->cleanUp();
	}
}