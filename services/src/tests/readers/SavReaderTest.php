<?php declare(strict_types=1);

namespace helena\tests\readers;

use helena\classes\Paths;
use helena\classes\TestCase;

class SavReaderTest extends ReaderTestBase
{
	public function testReadFile()
	{
		$file = Paths::GetTestsDataLocalPath() . '/testRadios.sav';
		$this->readAndCheckFile($file, '', [13822, 14258], 8939);

		$this->cleanUp();
	}
}