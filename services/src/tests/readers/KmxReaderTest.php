<?php declare(strict_types=1);

namespace helena\tests\readers;

use helena\classes\Paths;

class KmxReaderTest extends ReaderTestBase
{
	public function testReadFile()
	{
		$file = Paths::GetTestsDataLocalPath() . '/testCABA.kmz';
		$this->readAndCheckFile($file, '1', [2732, 2528], [352968, 350630]);

		$file2 = Paths::GetTestsDataLocalPath() . '/testMIAA.kmz';
		$this->readAndCheckFile($file2, '1', [6390, 5773], [514391, 523129, 523809]);

		$file3 = Paths::GetTestsDataLocalPath() . '/testOriginarias.kml';
		$this->readAndCheckFile($file3, 'false', 3403, 615243);

		$this->cleanUp();
	}
}