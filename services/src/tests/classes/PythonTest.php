<?php declare(strict_types=1);

namespace helena\tests\classes;

use helena\classes\Python;
use helena\classes\TestCase;

class PythonTest extends TestCase
{
	public function testPython()
	{
		$script = "pyTest3.py";
		$lines = Python::Execute($script, array(1, 2));

		$this->assertEquals("running ok", $lines[sizeof($lines) - 1]);
	}
}
