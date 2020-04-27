<?php declare(strict_types=1);

namespace helena\tests;

use helena\classes\CsvReader;
use helena\classes\Paths;
use minga\framework\tests\TestCaseBase;

class CsvReaderTest extends TestCaseBase
{
	public function testRead()
	{
		$reader = new CsvReader();
		$reader->Open(Paths::GetTestsDataLocalPath() . '/test.csv');

		$header = $reader->GetHeader();
		$this->assertEquals($header, ['a', 'b', 'c']);

		$dataByRow = $reader->GetNextRowsByRow(1);
		$this->assertEquals($dataByRow, [[1, 'x y', 3.5]]);

		$dataByColumn = $reader->GetNextRowsByColumn(1);
		$this->assertEquals($dataByColumn, [[2], ['xyz'], [-1]]);

		$last = $reader->GetNextRowsByRow();
		$this->assertEmpty($last);

		$this->assertTrue($reader->eof);

		$reader->Close();
	}
}

