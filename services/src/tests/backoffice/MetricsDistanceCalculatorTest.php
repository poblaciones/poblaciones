<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\TestCase;
use helena\services\backoffice\metrics\MetricsDistanceCalculator;
use minga\framework\Reflection;

class MetricsDistanceCalculatorTest extends TestCase
{
	public function testGetColumnName()
	{
		$controller = new MetricsDistanceCalculator();
		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', 'Dataset (náme)', 'name');
		$this->assertEquals('Dataset_name_name', $ret);

		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', '1234567890', 'abc', 10);
		$this->assertEquals('123456_abc', $ret);

		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', '1234567890', 'abcdefghij', 10);
		$this->assertEquals('_abcdefghi', $ret);

		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', '1234567890', 'abcdefghij', 10);
		$this->assertEquals('_abcdefghi', $ret);

		$ret = Reflection::CallPrivateMethod($controller, 'GetColumnName', '1234567890', 'abcdefghij', 14);
		$this->assertEquals('123_abcdefghij', $ret);
	}

}
