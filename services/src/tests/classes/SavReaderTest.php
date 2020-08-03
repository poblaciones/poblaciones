<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\CsvReader;
use helena\classes\Paths;
use helena\classes\TestCase;
use minga\framework\IO;

class SavReaderTest extends TestCase
{
	public function testReadFile()
	{
		$tester = new GenericReaderTester($this);

		$file = Paths::GetTestsDataLocalPath() . '/testRadios.sav';
		$tester->testReadFile($file, '', 14258, 8939);

		$tester->cleanUp();
	}
}