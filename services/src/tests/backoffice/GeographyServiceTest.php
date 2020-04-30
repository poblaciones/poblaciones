<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\entities\backoffice\Geography;
use helena\services\backoffice\GeographyService;
use minga\framework\tests\TestCaseBase;

class GeographyServiceTest extends TestCaseBase
{
	public function testGeographyService()
	{
		$controller = new GeographyService();
		$ret = $controller->GetAllGeographies();
		$this->assertIsArray($ret);
		$this->assertGreaterThan(0, count($ret));
		$this->assertInstanceOf(Geography::class, $ret[0]);
		$this->assertGreaterThan(0, $ret[0]->getId());
		$this->assertNotEmpty($ret[0]->getCaption());
	}
}
