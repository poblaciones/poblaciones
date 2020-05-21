<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\TestCase;
use helena\controllers\frontend\cHandle;
use minga\framework\Context;
use minga\framework\Reflection;

class cHandleTest extends TestCase
{
	private $workId;
	private $metricId;
	private $regionId;

	public function setUp()
	{
		$this->workId = $this->Get('workId');
		$this->metricId = $this->Get('metricId');
		$this->regionId = $this->Get('regionId');
	}

	/**
	 * @dataProvider CacheSettingProvider
	 */
	public function testShowWork($cacheSetting)
	{
		Context::Settings()->Cache()->Enabled = $cacheSetting;

		$controller = new cHandle();
		Reflection::CallPrivateMethod($controller, 'ShowWork', $this->workId);

		$this->assertEquals($controller->templateValues['handleTitle'], $controller->templateValues['htmltitle']);
		$this->assertTrue(isset($controller->templateValues['metadata_pdf']));

		$this->assertGreaterThan(0, count($controller->templateValues['metadata']));
		$this->assertGreaterThan(0, count($controller->templateValues['links']));
		$this->assertGreaterThan(0, count($controller->templateValues['items']));


		$this->assertEquals($controller->templateValues['metadata'][0]['name'], 'citation_title');
		$this->assertStringContainsString('educativos', $controller->templateValues['metadata'][0]['value']);
		$this->assertEquals($controller->templateValues['metadata'][1]['name'], 'citation_publication_date');
		$this->assertEquals(strlen($controller->templateValues['metadata'][1]['value']), 19);

		$this->assertIsNumeric($controller->templateValues['links'][0]['Id']);
		$this->assertStringContainsString('_primarias_', $controller->templateValues['links'][0]['UrlName']);
		$this->assertStringContainsString('primarias', $controller->templateValues['links'][0]['Name']);

		$this->assertStringContainsString('educativos', $controller->templateValues['htmltitle']);
	}

	public function testShowWorkMetric()
	{
		$controller = new cHandle();
		Reflection::CallPrivateMethod($controller, 'ShowWorkMetric', $this->workId, $this->metricId, null);

		$this->assertStringContainsString('universitario', $controller->templateValues['handleTitle']);
		$this->assertEquals(1, count($controller->templateValues['variables']));

		$this->assertGreaterThan(0, count($controller->templateValues['metadata']));
		$this->assertGreaterThan(0, count($controller->templateValues['items']));

		$this->assertStringContainsString('educativos', $controller->templateValues['items'][0]['Name']);
		$this->assertStringContainsString('educativos', $controller->templateValues['items'][0]['Value']);

		return $controller->templateValues;
	}

	/**
	 * @depends testShowWorkMetric
	 */
	public function testShowWorkMetricRegion(array $prevResult)
	{
		$controller = new cHandle();
		Reflection::CallPrivateMethod($controller, 'ShowWorkMetric', $this->workId, $this->metricId, $this->regionId);

		$this->assertStringContainsString('Buenos Aires', $controller->templateValues['clippingRegionItem']);
		$this->assertEquals($controller->templateValues['clippingRegion'], 'Distritos');
		$this->assertEquals($controller->templateValues['parentCaption'], 'Argentina');

		$this->assertEquals($prevResult['htmltitle'], $controller->templateValues['htmltitle']);
		$this->assertEquals($prevResult['metadata'], $controller->templateValues['metadata']);
		$this->assertEquals($prevResult['items'], $controller->templateValues['items']);
		$this->assertEquals($prevResult['variables'], $controller->templateValues['variables']);
	}

}
