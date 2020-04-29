<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Session;
use helena\services\backoffice\WorkService;
use minga\framework\tests\TestCaseBase;

class WorkServiceTest extends TestCaseBase
{
	public function testWorkService()
	{
		$this->markTestIncomplete('Da error, El elemento no existe ne la base de datos');
		$workId = 37;
		$controller = new WorkService();
		$ret = $controller->GetWorkInfo($workId);
	}
}
