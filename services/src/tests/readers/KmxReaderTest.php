<?php declare(strict_types=1);

namespace helena\tests\readers;

use helena\classes\Paths;

class KmxReaderTest extends ReaderTestBase
{
	public function testReadFile()
	{
		$file = Paths::GetTestsDataLocalPath() . '/testCABA.kmz';
		$this->readAndCheckFile($file, 'circuito_01', 2528, 350630);

		$file2 = Paths::GetTestsDataLocalPath() . '/testMIAA.kmz';
		$this->readAndCheckFile($file2, 'registrados en 2017', 5773, [514391, 523809]);

		$file3 = Paths::GetTestsDataLocalPath() . '/testOriginarias.kml';
		$this->readAndCheckFile($file3, 'false', 3403, 615243);

		$this->cleanUp();
	}
}