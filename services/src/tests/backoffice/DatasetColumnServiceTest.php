<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\services\backoffice\DatasetColumnService;
use helena\entities\backoffice\DraftDatasetColumn;
use minga\framework\tests\TestCaseBase;

class DatasetColumnServiceTest extends TestCaseBase
{
	public function testDatsetColumn()
	{
		$datasetId = 119;
		$controller = new DatasetColumnService();
		$ret = $controller->GetDatasetColumns($datasetId);
		$this->assertIsArray($ret);
		$this->assertGreaterThan(0, count($ret));
		$this->assertInstanceOf(DraftDatasetColumn::class, $ret[0]);
		$this->assertGreaterThan(0, $ret[0]->getId());
		$this->assertNotEmpty($ret[0]->getField());
	}

	public function testDatsetColumnLabels()
	{
		$controller = new DatasetColumnService();
		$datasetId = 119;
		$ret = $controller->GetDatasetColumnsLabels($datasetId);
		$this->assertIsArray($ret);
	}
}
