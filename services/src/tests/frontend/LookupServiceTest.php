<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\services\frontend\LookupService;
use minga\framework\tests\TestCaseBase;

class LookupServiceTest extends TestCaseBase
{
	public function testSearch()
	{
		$search = new LookupService();
		$ret = $search->Search('escuelas', '', false);
		$this->assertIsArray($ret);
		$ret = $search->Search('asldkfhasldfkjasdlfkjaslfasjdflkasjflaksjflaskf', '', false);
		$this->assertEmpty($ret);
	}
}
