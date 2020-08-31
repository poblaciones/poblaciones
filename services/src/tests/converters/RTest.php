<?php declare(strict_types=1);

namespace helena\tests\converters;

use helena\classes\TestCase;
use helena\classes\Paths;
use minga\framework\IO;
use helena\classes\writers\RWriter;

class RTest extends TestCase
{
	public function testSpssToR()
	{
		$spssData = Paths::GetTestsDataLocalPath() . '/testRadios.sav';
		$outR = IO::GetTempFilename();

		RWriter::SpssToR($spssData, $outR);

		$this->assertFile($outR, [3186, 3188]);
	}
}
