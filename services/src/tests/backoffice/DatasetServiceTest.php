<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Session;
use helena\services\backoffice\DatasetService;
// use helena\entities\backoffice\DraftDatasetColumn;
use minga\framework\tests\TestCaseBase;

class DatasetServiceTest extends TestCaseBase
{
	public function testDatasetData()
	{
		$k = 119;
		$filterscount = 0;
		$groupscount = 0;
		$pagenum = 0;
		$pagesize = 50;
		$recordstartindex = 0;
		$recordendindex = 50;
		$page = 0;

		$datasetId = $k;

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
