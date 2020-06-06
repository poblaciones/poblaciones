<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\classes\Account;
use helena\classes\Session;
use helena\classes\TestCase;
use helena\entities\backoffice\DraftDatasetColumn;
use helena\services\backoffice\DatasetColumnService;

class DatasetColumnServiceTest extends TestCase
{
	public function setUp()
	{
		Account::Impersonate($this->GetGlobal('dbuser'));
	}

	public function testGetDatasetColumns()
	{
		$datasetId = $this->Get();
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
		$datasetId = $this->Get();
		$this->assertNull(Session::CheckIsDatasetReader($datasetId));
		$controller = new DatasetColumnService();
		$ret = $controller->GetDatasetColumnsLabels($datasetId);
		$this->assertIsArray($ret);
	}

}
