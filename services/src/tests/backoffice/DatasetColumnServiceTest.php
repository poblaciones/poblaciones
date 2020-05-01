<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Account;
use helena\classes\Session;
use helena\entities\backoffice\DraftDatasetColumn;
use helena\services\backoffice\DatasetColumnService;
use minga\framework\tests\TestCaseBase;

class DatasetColumnServiceTest extends TestCaseBase
{
	public function setUp()
	{
		Account::Impersonate('admin');
	}

	public function testGetDatasetColumns()
	{
		$datasetId = 119;
		$this->assertNull(Session::CheckIsDatasetReader($datasetId));
		$controller = new DatasetColumnService();
		$ret = $controller->GetDatasetColumns($datasetId);
		$this->assertIsArray($ret);
		$this->assertGreaterThan(0, count($ret));
		$this->assertInstanceOf(DraftDatasetColumn::class, $ret[0]);
		$this->assertGreaterThan(0, $ret[0]->getId());
		$this->assertNotEmpty($ret[0]->getField());
	}

	public function testGetDatasetColumnsLabels()
	{
		$datasetId = 119;
		$this->assertNull(Session::CheckIsDatasetReader($datasetId));
		$controller = new DatasetColumnService();
		$ret = $controller->GetDatasetColumnsLabels($datasetId);
		$this->assertIsArray($ret);
	}
}
