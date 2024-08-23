<?php

namespace helena\services\backoffice;

use helena\services\common\BaseService;
use helena\services\common\AuthenticationService;
use helena\db\frontend\SignatureModel;
use helena\classes\Account;
use helena\classes\App;

class ConfigurationService extends BaseService
{
	public function GetTransactionServer()
	{

	}

	public function GetConfiguration()
	{
		$userService = new AuthenticationService();
		$user = $userService->GetStatus();

		$model = new SignatureModel();
		if (App::Settings()->Servers()->IsTransactionServerRequest() || App::Settings()->Servers()->LoadLocalSignatures)
			$signatures = $model->GetSignatures();
		else
			$signatures = $model->GetRemoteSignatures(true);

		$dynamicServer = App::Settings()->Servers()->GetTransactionServer();
		$mainServer = App::Settings()->Servers()->Main();
		if (!$user['Logged'])
			return array('User' => $user, 'MainServer' => $mainServer->publicUrl,
				'DynamicServer' => $dynamicServer->publicUrl);
		else
			return array('UseCalculated' => App::Settings()->Map()->UseCalculated,
								'UseTextures' => App::Settings()->Map()->UseTextures,
								'UseGradients' => App::Settings()->Map()->UseGradients,
								'UsePerimeter' => App::Settings()->Map()->UsePerimeter,
								'DefaultRelocateLocation' => App::Settings()->Map()->DefaultRelocateLocation,
								'Signatures' => $signatures,
								'User' => $user,
								'MainServer' => $mainServer->publicUrl,
								'DynamicServer' => $dynamicServer->publicUrl);
	}

	public function SetUserSetting($key, $value)
	{
		$user = Account::Current();
		$user->SetSetting($key, $value);
		return self::OK;
	}

}

