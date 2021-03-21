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
		$this->assertGreaterThan(0, count($ret), "Has more than zero elements");
		$this->assertInstanceOf(MetricGroupInfo::class, $ret[1]);
		$this->assertTrue($ret[1]->Items[0]['Header'], "First is header");
		$this->assertInstanceOf(MetricInfo::class, $ret[1]->Items[1], "Second element is MetricInfo");
	}
}
