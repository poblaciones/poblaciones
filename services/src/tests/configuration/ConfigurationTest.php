<?php declare(strict_types=1);

namespace helena\tests\configuration;

use helena\classes\TestCase;
use helena\classes\App;
use minga\framework\Context;
use minga\framework\Str;

class ConfigurationTest extends TestCase
{
	public function testFullTextMinWordLength()
	{
		$row = App::Db()->fetchAssoc("SHOW VARIABLES LIKE 'ft_min_word_len'");
		$value = $row['Value'];
		$config = Context::Settings()->Db()->FullTextMinWordLength;

		$this->assertEquals($value, $config, "El parámetro del archivo settings.php para Context::Settings()->Db()->FullTextMinWordLength no coincide con el valor de ft_min_word_len de la base de datos. El valor debería ser: " . $value);
	}

	public function testPHPVersion()
	{
		$version = floatval(phpversion());
		$this->assertGreaterThanOrEqual(7, $version);
		$this->assertLessThan(8, $version);
	}

	public function testMapsKey()
	{
		$key = Context::Settings()->Keys()->GoogleMapsKey;
		if (App::Debug()) $key = "SKIP";
		$this->assertNotEmpty($key, "No hay un key de Google Maps.");
	}

	public function testMySQLVersion()
	{
		$row = App::Db()->fetchScalar("SELECT @@VERSION");
		$parts = explode('-', $row);
		$number = floatval($parts[0]);
		$engime = $parts[1];
		if (Str::StartsWith($engime, "MariaDB"))
		{
			$this->assertGreaterThanOrEqual(10.2, $number);
		}
		else
		{	// mysql
			$this->assertGreaterThanOrEqual(5.7, $number);
			$this->assertLessThan(8, $number);
		}
	}


}
