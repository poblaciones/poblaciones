<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Session;
use helena\classes\TestCase;
use helena\services\backoffice\DatasetService;

class DatasetServiceTest extends TestCase
{
	public function testGetDatasetData()
	{
		$k = $this->Get('k');
		$filterscount = $this->Get('filterscount');
		$groupscount = $this->Get('groupscount');
		$pagenum = $this->Get('pagenum');
		$pagesize = $this->Get('pagesize');
		$recordstartindex = $this->Get('recordstartindex');
		$recordendindex = $this->Get('recordendindex');
		$page = $this->Get('page');

		$datasetId = $k;

		$this->assertNull(Session::CheckIsDatasetReader($datasetId));

		$rows = $pagesize;
		$from = $page * $rows;
		$controller = new DatasetService();
		$ret = $controller->GetDatasetData($datasetId, $from, $rows);
		$this->assertIsArray($ret);
		$this->assertIsInt($ret['TotalRows']);
		$this->assertIsArray($ret['Data']);
		$this->assertEquals(min($pagesize, $ret['TotalRows']), count($ret['Data']));
	}
}
