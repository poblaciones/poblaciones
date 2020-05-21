<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\CsvReader;
use helena\classes\Paths;
use helena\classes\TestCase;
use minga\framework\IO;

class CsvReaderTest extends TestCase
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

	/**
	 * @dataProvider ParamProvider
	 */
	public function testRead($lines, $expected, $byRow)
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

	public function ParamProvider()
	{
		return [
			[
				'lines' => ['a'],
				'expected' => [['a']],
				'byRow' => true,
			],
			[
				'lines' => [
					'a', '"a"', '"a""a"', '"a', '"asdf",b',
					'"a""sdf",b', '"a""s""df",b', '"a,sdf",b',
					'"a,s,df",b', 'asdf",b', 'asd"f,b', 'asd""f,b',
					'asdf,"b', 'asdf,b', ',b', '"",b',
				],
				'expected' => [
					["a"], ["a"], ["a\"a"], ["\"a"], ["asdf", "b"], ["a\"sdf", "b"],
					["a\"s\"df", "b"], ["a,sdf", "b"], ["a,s,df", "b"], ["asdf\"", "b"],
					["asd\"f", "b"], ["asd\"\"f", "b"], ["asdf", "\"b"], ["asdf", "b"],
					["", "b"], ["", "b"],
				],
				'byRow' => true,
			],
			[
				'lines' => [
					'"a",b,c', 'a,"b",c', 'a,b,"c"', '"a",b,"c"',
					'"a","b","c"', 'a,"b""",c', 'a,"""b""",c',
				],
				'expected' => [
					["a", "b", "c"], ["a", "b", "c"], ["a", "b", "c"],
					["a", "b", "c"], ["a", "b", "c"], ["a", "b\"", "c"],
					["a", "\"b\"", "c"],
				],
				'byRow' => true,
			],
			[
				'lines' => [
					'"a",b,c', 'a,"b",c', 'a,b,"c"', '"a",b,"c"',
					'"a","b","c"', 'a,"b""",c', 'a,"""b""",c',
				],
				'expected' => [
					["a", "a", "a", "a", "a", "a", "a"],
					["b", "b", "b", "b", "b", "b\"", "\"b\""],
					["c", "c", "c", "c", "c", "c", "c"],
				],
				'byRow' => false,
			],
		];
	}

}

