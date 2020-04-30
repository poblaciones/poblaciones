<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Account;
use helena\classes\Session;
use helena\services\backoffice\MetricService;
use minga\framework\PhpSession;
use minga\framework\tests\TestCaseBase;

class MetricServiceTest extends TestCaseBase
{
	public function setUp()
	{
		Account::Impersonate('admin');
	}

	public function testGetCartographyMetrics()
	{
		$controller = new MetricService();
		$ret = $controller->GetCartographyMetrics();
		$this->assertIsArray($ret);
	}

	public function testGetPublicMetrics()
	{
		$controller = new MetricService();
		$ret = $controller->GetPublicMetrics();
		$this->assertIsArray($ret);
		$this->assertGreaterThan(0, count($ret));
		$this->assertGreaterThan(0, $ret[0]['Id']);
		$this->assertNotEmpty($ret[0]['Caption']);
	}

	public function testGetWorkMetricVersions()
	{
		$workId = 37;
		$controller = new MetricService();
		$ret = $controller->GetWorkMetricVersions($workId);
		$this->assertIsArray($ret);
	}

	public function testGetDatasetMetricVersionLevels()
	{
		$datasetId = 119;
		$controller = new MetricService();
		$ret = $controller->GetDatasetMetricVersionLevels($datasetId);
		$this->assertIsArray($ret);
		$this->assertInstanceOf(\stdClass::class, $ret[0]);
		$this->assertGreaterThan(0, $ret[0]->Id);
		$this->assertInstanceOf(\stdClass::class, $ret[0]->MetricVersion);
		$this->assertGreaterThan(0, $ret[0]->MetricVersion->Id);
	}

	public function testGetColumnDistributions()
	{
		$k = 209;
		$c = 'O';
		$ci = 9744;
		$o = 'O';
		$oi = 9741;
		$s = 100;

		$controller = new MetricService();
		$ret = $controller->GetColumnDistributions($k, $c, $ci, $o, $oi, $s);
		$this->assertInstanceOf(\stdClass::class, $ret);
		$this->assertNotEmpty($ret->EllapsedMs);
		$this->assertIsArray($ret->Groups);
		$this->assertGreaterThan(0, count($ret->Groups));
	}
}
