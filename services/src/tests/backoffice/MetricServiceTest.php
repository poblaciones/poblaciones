<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Session;
use helena\services\backoffice\MetricService;
use minga\framework\PhpSession;
use minga\framework\tests\TestCaseBase;

class MetricServiceTest extends TestCaseBase
{
	public function setUp()
	{
	}

	public function testGetCartographyMetrics()
	{
		// PhpSession::SetSessionValue('user', 'admin');
		//  public 'user' => string 'admin' (length=5)
		//   public 'password' => string '$2y$10$3ZM..N0URJfcwxgeL7QHQepGCbbbWYxrWsDk4yS.MfmMJB53UE6Zi' (length=60)
		//   public 'userId' => int 1
		//   public 'firstName' => string 'Administrador' (length=13)
		//   public 'lastName' => string 'Administrador' (length=13)
		//   public 'privileges' => string 'A' (length=1)
		//   public 'facebookOauthId' => null
		//   public 'googleOauthId' => null
		//   public 'isActive' => int 1
		//   protected 'geographies' => null

		$this->markTestIncomplete('Resolver qué hacer con login');
		$controller = new MetricService();
		$ret = $controller->GetCartographyMetrics();
	}

	public function testGetPublicMetrics()
	{
		$this->markTestIncomplete('Resolver qué hacer con login');
		$controller = new MetricService();
		$ret = $controller->GetPublicMetrics();
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
		$this->markTestIncomplete('Resolver qué hacer con login');
		$datasetId = 119;
		$controller = new MetricService();
		$ret = $controller->GetDatasetMetricVersionLevels($datasetId);
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
