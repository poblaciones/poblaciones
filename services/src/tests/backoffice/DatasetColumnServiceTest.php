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

	public function testGetCopyColumnName()
	{
		$controller = new DatasetColumnService();
		$ret = $controller->GetCopyColumnName('dst_', 'Dataset (náme)', 'name');
		$this->assertEquals('dst_Dataset_name_name', $ret);

		$ret = $controller->GetCopyColumnName('', '1234567890', 'abc', 10);
		$this->assertEquals('123456_abc', $ret);

		$ret = $controller->GetCopyColumnName('', '1234567890', 'abcdefghij', 10);
		$this->assertEquals('_abcdefghi', $ret);

		$ret = $controller->GetCopyColumnName('p_', '1234567890', 'abcdefghij', 10);
		$this->assertEquals('p__abcdefg', $ret);

		$ret = $controller->GetCopyColumnName('p_', '1234567890', 'abcdefghij', 14);
		$this->assertEquals('p_1_abcdefghij', $ret);
	}


}
