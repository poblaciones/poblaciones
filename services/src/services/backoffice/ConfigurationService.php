<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;
use helena\services\common\AuthenticationService;

use minga\framework\Context;

class ConfigurationService extends BaseService
{
	public function GetConfiguration()
	{
		$userService = new AuthenticationService();
		$user = $userService->GetStatus();

		$ret = array('UseCalculated' => Context::Settings()->Map()->UseCalculated,
								'UseTextures' => Context::Settings()->Map()->UseTextures,
								'UseGradients' => Context::Settings()->Map()->UseGradients,
								'DefaultRelocateLocation' => Context::Settings()->Map()->DefaultRelocateLocation,
								'User' => $user);
		return $ret;
	}
}

