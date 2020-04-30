<?php declare(strict_types=1);

namespace helena\tests;

use helena\classes\App;
use helena\services\backoffice\PublishService;
use minga\framework\tests\TestCaseBase;

class PushStepKeyTest extends TestCaseBase
{
	public function testPushStepKey()
	{
		$key = 'xx';
		$service = new PublishService();
		$ret = App::Json($service->StepPublication($key));
		vd($ret);
	}
}
