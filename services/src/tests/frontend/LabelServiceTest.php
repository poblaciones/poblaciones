<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\entities\frontend\clipping\LabelsDataInfo;
use helena\services\frontend\LabelsService;
use minga\framework\tests\TestCaseBase;

class LabelServiceTest extends TestCaseBase
{
	public function testGetLabels()
	{
		$x = 85;
		$y = 156;
		$z = 8;
		$b = null;

		$controller = new LabelsService();
		$ret = $controller->GetLabels($x, $y, $z, $b);
		$this->assertInstanceOf(LabelsDataInfo::class, $ret);
		$this->assertNotEmpty($ret->EllapsedMs);
		$this->assertIsArray($ret->Data);
		$this->assertGreaterThan(0, count($ret->Data));
	}
}
