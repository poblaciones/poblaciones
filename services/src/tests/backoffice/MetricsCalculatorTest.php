<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\TestCase;
use helena\services\backoffice\metrics\MetricsCalculator;
use minga\framework\Reflection;

class MetricsCalculatorTest extends TestCase
{
	public function testGetColumnName()
	{
		$controller = new MetricsCalculator();
		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', 'dst_', 'Dataset (náme)', 'name');
		$this->assertEquals('dst_Dataset_name_name', $ret);

		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', '', '1234567890', 'abc', 10);
		$this->assertEquals('123456_abc', $ret);

		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', '', '1234567890', 'abcdefghij', 10);
		$this->assertEquals('_abcdefghi', $ret);

		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', 'p_', '1234567890', 'abcdefghij', 10);
		$this->assertEquals('p__abcdefg', $ret);

		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', 'p_', '1234567890', 'abcdefghij', 14);
		$this->assertEquals('p_1_abcdefghij', $ret);
	}

}
