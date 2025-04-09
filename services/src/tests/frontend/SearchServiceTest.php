<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\TestCase;
use helena\services\frontend\SearchService;

class SearchServiceTest extends TestCase
{
	public function testSearch()
	{
		$search = new SearchService();
		$ret = $search->Search($this->Get(), '', false);
		$this->assertIsArray($ret);
		$ret = $search->Search('asldkfhasldfkjasdlfkjaslfasjdflkasjflaksjflaskf', '', false);
		$this->assertEmpty($ret);
	}
}
