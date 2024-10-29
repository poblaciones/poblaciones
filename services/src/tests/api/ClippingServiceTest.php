<?php declare(strict_types=1);

namespace helena\tests\api;

use helena\classes\TestCase;
use helena\services\api\ClippingService;
use helena\classes\Account;


class ClippingServiceTest extends TestCase
{
	public function setUp()
	{
		Account::Impersonate($this->GetGlobal('dbuser'));
	}

	public function testGetFeature()
	{
		// Trae la primera para tener un Id válido
		$featureId = $this->Get();

		// La obtiene vía la API
		$controller = new ClippingService();
		$ret = $controller->GetFeature(1, $featureId);
		$this->assertIsArray($ret);
		$this->assertIsFloat($ret['Centroid']->Lat);
		$this->assertIsFloat($ret['Centroid']->Lon);
		$this->assertIsArray($ret['Data']);
		$this->assertIsString($ret['Metadata']->Name);
	}
}
