<?php declare(strict_types=1);

namespace helena\tests\converters;

use helena\classes\TestCase;
use helena\classes\Paths;
use minga\framework\IO;
use helena\classes\writers\StataWriter;

class StataTest extends TestCase
{
	public function testSpssToStata()
	{
		$spssData = Paths::GetTestsDataLocalPath() . '/testRadios.sav';
		$outSta = IO::GetTempFilename();

		StataWriter::SpssToStata($spssData, $outSta);

		$this->assertFile($outSta, 21835);
	}
}
