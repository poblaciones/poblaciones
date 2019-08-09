<?php

namespace helena\tests;

use minga\framework\IO;
use helena\classes\CsvReader;
use helena\controllers\common\cController;

class cTestCsv extends cController
{
	public function Show()
	{
		// if ($app = Session::CheckIsMegaUser())
		// 	return $app;

		$return = '<pre>';
		$lines = [
			'', 'a', '"a"', '"a""a"', '"a', '"asdf",b',
			'"a""sdf",b', '"a""s""df",b', '"a,sdf",b',
			'"a,s,df",b', 'asdf",b', 'asd"f,b',
			'asd""f,b', 'asdf,"b', 'asdf,b', ',b',
			'"",b',
		];
		$expected = '[[],["a"],["a"],["a\"a"],["\"a"],["asdf","b"],["a\"sdf","b"],["a\"s\"df","b"],["a,sdf","b"],["a,s,df","b"],["asdf\"","b"],["asd\"f","b"],["asd\"\"f","b"],["asdf","\"b"],["asdf","b"],["","b"]]';
		$res = $this->TestArray($lines);
		if(json_encode($res) !== $expected)
			$return .= "Error: TestArray1\n";
		else
			$return .= "OK: TestArray1\n";

		$lines = [
			'"a",b,c', 'a,"b",c', 'a,b,"c"', '"a",b,"c"',
			'"a","b","c"', 'a,"b""",c', 'a,"""b""",c',
		];
		$expected = '[["a","b","c"],["a","b","c"],["a","b","c"],["a","b","c"],["a","b","c"],["a","b\"","c"]]';
		$res = $this->TestArray($lines);
		if(json_encode($res) !== $expected)
			$return .= "Error: TestArray2\n";
		else
			$return .= "OK: TestArray2\n";

		$res = $this->TestArray($lines, false);
		$expected = '[["a","a","a","a","a","a"],["b","b","b","b","b","b\""],["c","c","c","c","c","c"]]';
		if(json_encode($res) !== $expected)
			$return .= "Error: TestArray3\n";
		else
			$return .= "OK: TestArray3\n";


		return $return . '</pre>FIN';
	}

	private function TestArray($lines, $byRow = true)
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

		return $data;
	}

}
