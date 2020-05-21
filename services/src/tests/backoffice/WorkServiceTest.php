<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Session;
use helena\classes\TestCase;
use helena\services\backoffice\WorkService;

class WorkServiceTest extends TestCase
{
	public function testGetWorkInfo()
	{
		$this->markTestIncomplete('Da error, El elemento no existe ne la base de datos');
		$workId = $this->Get();
		$this->assertNull(Session::CheckIsWorkReader($workId));
		$controller = new WorkService();
		$ret = $controller->GetWorkInfo($workId);
	}
}
