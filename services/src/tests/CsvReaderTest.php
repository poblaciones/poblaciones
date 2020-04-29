<?php declare(strict_types=1);

namespace helena\tests;

use helena\classes\CsvReader;
use helena\classes\Paths;
use minga\framework\IO;
use minga\framework\tests\TestCaseBase;

class CsvReaderTest extends TestCaseBase
{
	public function testReadFile()
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

	public function testRead()
	{
		$this->doTestRead(['a'], [['a']]);

		$lines = [
			'a', '"a"', '"a""a"', '"a', '"asdf",b',
			'"a""sdf",b', '"a""s""df",b', '"a,sdf",b',
			'"a,s,df",b', 'asdf",b', 'asd"f,b', 'asd""f,b',
			'asdf,"b', 'asdf,b', ',b', '"",b',
		];
		$expected = [
			["a"], ["a"], ["a\"a"], ["\"a"], ["asdf", "b"], ["a\"sdf", "b"],
			["a\"s\"df", "b"], ["a,sdf", "b"], ["a,s,df", "b"], ["asdf\"", "b"],
			["asd\"f", "b"], ["asd\"\"f", "b"], ["asdf", "\"b"], ["asdf", "b"],
			["", "b"], ["", "b"],
		];
		$this->doTestRead($lines, $expected);

		$lines = [
			'"a",b,c', 'a,"b",c', 'a,b,"c"', '"a",b,"c"',
			'"a","b","c"', 'a,"b""",c', 'a,"""b""",c',
		];
		$expected = [
			["a", "b", "c"], ["a", "b", "c"], ["a", "b", "c"],
			["a", "b", "c"], ["a", "b", "c"], ["a", "b\"", "c"],
			["a", "\"b\"", "c"],
		];
		$this->doTestRead($lines, $expected);

		$expected = [
			["a", "a", "a", "a", "a", "a", "a"],
		  	["b", "b", "b", "b", "b", "b\"", "\"b\""],
		  	["c", "c", "c", "c", "c", "c", "c"],
		];
		$this->doTestRead($lines, $expected, false);
	}

	private function doTestRead($lines, $expected, $byRow = true)
	{
		$file = IO::GetTempFilename();
		file_put_contents($file, implode("\r\n", $lines));

		$csv = new CsvReader();
		$csv->delimiter = ',';
		$csv->Open($file);

		if($byRow)
			$data = $csv->GetNextRowsByRow();
		else
			$data = $csv->GetNextRowsByColumn();

		$csv->Close();
		IO::Delete($file);

		$this->assertEquals($data, $expected);
	}

}

