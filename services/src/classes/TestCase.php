<?php declare(strict_types=1);

namespace helena\classes;

use helena\classes\Paths;
use minga\framework\Context;
use minga\framework\settings\CacheSettings;
use minga\framework\tests\TestCaseBase;

class TestCase extends TestCaseBase
{
	protected $TestData = [];

	public function CacheSettingProvider()
	{
		return [
			'Sin Cache' => [CacheSettings::Disabled],
			'Con Cache' => [CacheSettings::Enabled],
		];
	}

	public function GetGlobal($index = null)
	{
		if($index === null)
			return $this->TestData['global'];
		return $this->TestData['global'][$index];
	}

	public function Get($index = null)
	{
		$caller = debug_backtrace()[1];
		$class = $caller['class'];
		$function = $caller['function'];

		if($index === null)
			return $this->TestData[$class][$function];
		return $this->TestData[$class][$function][$index];
	}

	public function LoadTestData()
	{
		$custom = Paths::GetTestsConfigLocalPath() . '/customSettings.php';
		$this->TestData = require(Paths::GetTestsConfigLocalPath() . '/defaultSettings.php');
		if(file_exists($custom))
			$this->TestData = array_merge($this->TestData, require($custom));
	}

	public function __construct($name = null, array $data = [], $dataName = '')
	{
		$this->LoadTestData();

		Context::Settings()->Cache()->Enabled = CacheSettings::Disabled;
		parent::__construct($name, $data, $dataName);
	}

}
