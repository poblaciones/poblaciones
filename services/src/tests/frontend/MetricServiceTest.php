<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\TestCase;
use helena\entities\frontend\metric\MetricGroupInfo;
use helena\entities\frontend\metric\MetricInfo;
use helena\services\frontend\FabService;

class MetricServiceTest extends TestCase
{
	public function testGetFabMetrics()
	{
		$controller = new FabService();
		$ret = $controller->GetFabMetrics();
		$this->assertIsArray($ret);
		$this->assertGreaterThan(0, count($ret));
		$this->assertInstanceOf(MetricGroupInfo::class, $ret[0]);
		$this->assertTrue(isset($ret[0]->Metrics[0]));
		$this->assertTrue($ret[0]->Metrics[0]['Header']);
		$this->assertInstanceOf(MetricInfo::class, $ret[0]->Metrics[1]);
	}
}
