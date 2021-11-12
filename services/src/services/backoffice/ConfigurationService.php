<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;
use helena\services\common\AuthenticationService;
use helena\db\frontend\SignatureModel;

use minga\framework\Context;

class ConfigurationService extends BaseService
{
	public function GetConfiguration()
	{
		$userService = new AuthenticationService();
		$user = $userService->GetStatus();

		$model = new SignatureModel();
		$signatures = $model->GetSignatures();

		if (!$user['Logged'])
			return array('User' => $user);
		else
			return array('UseCalculated' => Context::Settings()->Map()->UseCalculated,
								'UseTextures' => Context::Settings()->Map()->UseTextures,
								'UseGradients' => Context::Settings()->Map()->UseGradients,
								'UsePerimeter' => Context::Settings()->Map()->UsePerimeter,
								'DefaultRelocateLocation' => Context::Settings()->Map()->DefaultRelocateLocation,
								'Signatures' => $signatures,
								'User' => $user);
	}
}

