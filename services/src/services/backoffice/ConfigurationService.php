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
									'UseKmz' => Context::Settings()->Map()->UseKmz,
									'User' => $user);
		return $ret;
	}
}

