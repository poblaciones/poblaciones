<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Account;
use helena\classes\Session;
use helena\classes\TestCase;
use helena\services\backoffice\MetricService;

class MetricServiceTest extends TestCase
{
	public function setUp()
	{
		Account::Impersonate($this->GetGlobal('dbuser'));
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
		$workId = $this->Get();
		$this->assertNull(Session::CheckIsWorkReader($workId));
		$controller = new MetricService();
		$ret = $controller->GetWorkMetricVersions($workId);
		$this->assertIsArray($ret);
	}

	public function testGetDatasetMetricVersionLevels()
	{
		$datasetId = $this->Get();
		$this->assertNull(Session::CheckIsDatasetReader($datasetId));
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
		$k = $this->Get('k');
		$c = $this->Get('c');
		$ci = $this->Get('ci');
		$o = $this->Get('o');
		$oi = $this->Get('oi');
		$s = $this->Get('s');
		$filter = $this->Get('f');

		$this->assertNull(Session::CheckIsDatasetReader($k));
		$controller = new MetricService();
		$ret = $controller->GetColumnDistributions($k, $c, $ci, $o, $oi, $s, $filter);
		$this->assertInstanceOf(\stdClass::class, $ret);
		$this->assertNotEmpty($ret->EllapsedMs);
		$this->assertIsArray($ret->Groups);
		$this->assertGreaterThan(0, count($ret->Groups));
	}
}
