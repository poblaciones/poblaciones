<?php declare(strict_types=1);

namespace helena\tests\configuration;

use helena\classes\TestCase;
use helena\classes\App;
use minga\framework\Context;
use minga\framework\Log;
use minga\framework\Str;

class ErrorsConfigurationTest extends TestCase
{
	public function testNotifyAddressErrors()
	{
		$value = Context::Settings()->Mail()->NotifyAddressErrors;
		$this->assertNotEmpty($value, "El parámetro del archivo settings.php para Context::Settings()->Mail()->NotifyAddressErrors se encuentra vacío");
		$this->assertNotNull($value, "El parámetro del archivo settings.php para Context::Settings()->Mail()->NotifyAddressErrors se encuentra vacío");
	}

	public function testPhpIniParseErrors()
	{
		$logging = ini_get('log_errors');
		if ($logging == "1" || $logging == "On" || $logging == "on")
			$logging = true;
		$this->assertTrue($logging, "El parámetro log_errors del archivo php.ini (" . php_ini_loaded_file() . ") debe estar en 1 para poder monitorear adecuadamente errores de fatales o de parseo en PHP.");

		$level = ini_get("error_reporting");
		$this->assertEquals(32767, $level, "El parámetro error_reporting del archivo php.ini (" . php_ini_loaded_file() . ") debe coincidir con E_ALL.");

		$path = ini_get('error_log');
		$fatalErrorsPaths = Context::Paths()->GetLogLocalPath() . '/' . Log::FatalErrorsPath;
		$this->assertEquals($fatalErrorsPaths, $path, "El parámetro error_log del archivo php.ini (" . php_ini_loaded_file() . ") debe apuntar a la carpeta '" . $fatalErrorsPaths . "'");



	}

}
