<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Session;
use helena\classes\TestCase;
use helena\services\backoffice\WorkService;
use helena\classes\Account;

class WorkServiceTest extends TestCase
{
	public function setUp()
	{
		Account::Impersonate($this->GetGlobal('dbuser'));
	}
	public function testGetWorkInfo()
	{
		$workId = $this->Get();
		$this->assertNull(Session::CheckIsWorkReader($workId));
		$controller = new WorkService();
		$ret = $controller->GetWorkInfo($workId);
	}
}
