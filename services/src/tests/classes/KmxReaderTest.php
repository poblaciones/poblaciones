<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\CsvReader;
use helena\classes\Paths;
use helena\classes\TestCase;
use minga\framework\IO;

class KmxReaderTest extends TestCase
{
	public function testReadFile()
	{
		$tester = new GenericReaderTester($this);

		$file = Paths::GetTestsDataLocalPath() . '/testCABA.kmz';
		$tester->testReadFile($file, 'circuito_01', 2528, 350630);

		$file2 = Paths::GetTestsDataLocalPath() . '/testMIAA.kmz';
		$tester->testReadFile($file2, 'registrados en 2017', 5796, 523809);

		$file3 = Paths::GetTestsDataLocalPath() . '/testOriginarias.kml';
		$tester->testReadFile($file3, 'false', 3403, 615243);

		$tester->cleanUp();
	}
}