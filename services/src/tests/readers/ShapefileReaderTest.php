<?php declare(strict_types=1);

namespace helena\tests\readers;

use helena\classes\Paths;
use helena\classes\TestCase;
use helena\classes\readers\ShapefileReader;
class ShapefileReaderTest extends ReaderTestBase
{
	public function testReadFile()
	{
		$file = Paths::GetTestsDataLocalPath() . '/shapefiles/testEscuelas.zip';
		$this->readAndCheckFile($file, 0, 6810, 1259);

		$file = Paths::GetTestsDataLocalPath() . '/shapefiles/testZonas.zip';
		$this->readAndCheckFile($file, 0, 6628, 8808);

		$this->cleanUp();
	}
}