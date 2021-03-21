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

		$this->assertFile($outR, [3186, 3187, 3188]);
	}
	public function testSpssToRLista()
	{
		$spssData = Paths::GetTestsDataLocalPath() . '/testLista.sav';
		$outR = IO::GetTempFilename();

		RWriter::SpssToR($spssData, $outR);

		$this->assertFile($outR, [4787, 4788, 4789]);
	}
	public function testSpssToRValorSimple()
	{
		$spssData = Paths::GetTestsDataLocalPath() . '/testListaM8.sav';
		$outR = IO::GetTempFilename();

		RWriter::SpssToR($spssData, $outR);

		$this->assertFile($outR, [173, 174, 175]);
	}
	public function testSpssToREtiquetasNoCoincidentes()
	{
		$spssData = Paths::GetTestsDataLocalPath() . '/testListaM9b.sav';
		$outR = IO::GetTempFilename();

		RWriter::SpssToR($spssData, $outR);

		$this->assertFile($outR, [260, 261, 262]);
	}
}
