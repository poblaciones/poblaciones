<?php

namespace helena\controllers\authenticate;

use helena\classes\App;
use helena\controllers\common\cController;
use minga\framework\oauth\OauthData;
use minga\framework\oauth\OauthConnector;
use helena\services\common\BaseService;
use helena\classes\Register;
use minga\framework\Params;
use minga\framework\MessageBox;

class cOauth extends cController
{
	protected $oauth;

	public function Show()
	{
		$error = Params::SafeGet('error');
		if($error != '')
		{
			if ($error == 'access_denied')
			{
				$args = array("retry" => 'history.back(1);');
				MessageBox::ShowDialogPopup("No se han provisto los permisos necesarios para utilizar la cuenta de " . $this->oauth->ProviderName() . " en la identificación.", "Atención", $args );
			}
			$this->oauth->RedirectError($error);
		}

		$code = Params::SafeGet('code');
		$state = Params::SafeGet('state');
		if($code != '' && $state != '')
		{
			$data = $this->oauth->RequestData($code, $state);
			if ($data != null) {
				if ($data->email == '' || $data->verified == false)
					$this->RedirectErrorNoEmail();

				$this->LoginOrRegister($data);
				$this->oauth->RedirectSuccess($data, $state);
			}
		}
		$this->oauth->RedirectError();
	}

	private function LoginOrRegister($data): void
	{
		if (OauthData::SessionHasTerms()) {
			// Register
			if (!Register::CompleteOauthRegistrationEx($data))
				throw new MessageException('No pudo completarse la registración');
		} else {
			// Login
			$res = cLogin::LoadAndValidateAccount($data->email, true);
			//TODO: throw message exception???
			if ($res['status'] == BaseService::ERROR)
				throw new MessageException($res['message']);
			$res['account']->Begin();
		}
	}

	public function Post()
	{
		$url = Params::SafeGet('loginUrl');
		$returnUrl = Params::SafeGet('returnUrl');
		$terms = (bool)Params::SafeGet('reg_terms');
		//Redirige al proveedor de oauth para pedir autorización al usuario.
		$url = $this->oauth->ResolveRedirectProvider($url, $returnUrl, $terms);
		return App::Redirect($url);
	}
}
