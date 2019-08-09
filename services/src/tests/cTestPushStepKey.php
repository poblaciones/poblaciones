<?php

namespace helena\tests;

use helena\controllers\common\cController;
use helena\classes\Session;
use helena\classes\App;
use minga\framework\Params;
use helena\services\backoffice\PublishService;

class cTestPushStepKey extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		$key = Params::Get("key");
		if (!$key)
		{
			return 'Debe indicar el parámetro key';
		}

		$service = new PublishService();
		return App::Json($service->StepPublication($key));
	}
}
