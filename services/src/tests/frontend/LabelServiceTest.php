<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\TestCase;
use helena\entities\frontend\clipping\LabelsDataInfo;
use helena\services\frontend\LabelsService;
use minga\framework\Context;

class LabelServiceTest extends TestCase
{

	/**
	 * @dataProvider CacheSettingProvider
	 */
	public function testGetLabels($cacheSetting)
	{
		Context::Settings()->Cache()->Enabled = $cacheSetting;

		$x = $this->Get('x');
		$y = $this->Get('y');
		$z = $this->Get('z');
		$b = $this->Get('b');

		$controller = new LabelsService();
		$ret = $controller->GetLabels($x, $y, $z, $b);
		$this->assertInstanceOf(LabelsDataInfo::class, $ret);
		$this->assertNotEmpty($ret->EllapsedMs);
		$this->assertIsArray($ret->Data);
		$this->assertGreaterThan(0, count($ret->Data));
	}
}
