<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\entities\frontend\metric\MetricInfo;
use helena\entities\frontend\metric\SelectedMetric;
use helena\services\frontend\SelectedMetricService;
use minga\framework\Context;
use minga\framework\tests\TestCaseBase;

class SelectedMetricServiceTest extends TestCaseBase
{
	/**
	 * @dataProvider CacheSettingProvider
	 */
	public function testPublicGetSelectedMetric($cacheSetting)
	{
		Context::Settings()->Cache()->Enabled = $cacheSetting;

		$metricId = 3401;
		$controller = new SelectedMetricService();
		$ret = $controller->PublicGetSelectedMetric($metricId);
		$this->assertInstanceOf(SelectedMetric::class, $ret);
		$this->assertNotEmpty($ret->EllapsedMs);
		$this->assertInstanceOf(MetricInfo::class, $ret->Metric);
		$this->assertIsInt($ret->Metric->Id);
	}
}
