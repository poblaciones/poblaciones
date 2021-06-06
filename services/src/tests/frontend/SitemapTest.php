<?php declare(strict_types=1);

namespace helena\tests\frontend;

use helena\classes\TestCase;
use helena\db\frontend\MetadataModel;

class SitemapTest extends TestCase
{
	public function testSitemap()
	{
		$controller = new MetadataModel();
		$ret = $controller->GetSitemapLinks();
		$this->assertIsArray($ret);
	}
}
