<?php declare(strict_types=1);

namespace helena\tests\backoffice;

use helena\entities\backoffice\DraftInstitution;
use helena\entities\backoffice\DraftMetadataFile;
use helena\entities\backoffice\DraftMetricVersionLevel;
use helena\entities\backoffice\DraftSource;
use helena\entities\backoffice\DraftVariable;
use helena\entities\backoffice\User;
use helena\services\admin\UserService;
use helena\services\backoffice\InstitutionService;
use helena\services\backoffice\MetadataFileService;
use helena\services\backoffice\MetricService;
use helena\services\backoffice\SourceService;
use minga\framework\tests\TestCaseBase;

class GetFactoriesTest extends TestCaseBase
{
	public function testGetFactories()
	{
		$ret = [];
		$sourceService = new SourceService();
		$ret = $sourceService->GetNewSource();
		$this->assertInstanceOf(DraftSource::class, $ret);

		$institutionService = new InstitutionService();
		$ret = $institutionService->GetNewInstitution();
		$this->assertInstanceOf(DraftInstitution::class, $ret);

		$metadataFileService = new MetadataFileService();
		$ret = $metadataFileService->GetNewMetadataFile(null);
		$this->assertInstanceOf(DraftMetadataFile::class, $ret);

		$userService = new UserService();
		$ret = $userService->GetNewUser();
		$this->assertInstanceOf(User::class, $ret);

		$metricService = new MetricService();
		$ret = $metricService->GetNewMetricVersionLevel();
		$this->assertInstanceOf(DraftMetricVersionLevel::class, $ret);

		$ret = $metricService->GetNewVariable();

		$this->assertInstanceOf(DraftVariable::class, $ret);
		$this->assertisArray($ret->Values);

	}
}
