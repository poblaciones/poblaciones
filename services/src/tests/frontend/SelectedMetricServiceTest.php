<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\TestCase;
use helena\entities\frontend\metric\MetricInfo;
use helena\entities\frontend\metric\SelectedMetric;
use helena\services\frontend\SelectedMetricService;
use minga\framework\Context;

class SelectedMetricServiceTest extends TestCase
{
	/**
	 * @dataProvider CacheSettingProvider
	 */
	public function testPublicGetSelectedMetric($cacheSetting)
	{
		Context::Settings()->Cache()->Enabled = $cacheSetting;

		$metricId = $this->Get();
		$controller = new SelectedMetricService();
		$ret = $controller->PublicGetSelectedMetric($metricId);
		$this->assertInstanceOf(SelectedMetric::class, $ret);
		$this->assertNotEmpty($ret->EllapsedMs);
		$this->assertInstanceOf(MetricInfo::class, $ret->Metric);
		$this->assertIsInt($ret->Metric->Id);
	}
}
