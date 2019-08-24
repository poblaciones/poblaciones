<?php

namespace helena\controllers\authenticate;

use helena\classes\App;
use helena\controllers\common\cController;
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
			if($data != null)
				$this->oauth->RedirectSuccess($data);
		}
		$this->oauth->RedirectError();
	}

	public function Post()
	{
		$url = Params::SafeGet('loginUrl');
		$returnUrl = Params::SafeGet('returnUrl');
		$terms = Params::SafeGet('reg_terms');
		//Redirige al proveedor de oauth para pedir autorización al usuario.
		$url = $this->oauth->ResolveRedirectProvider($url, $returnUrl, $terms);
		return App::Redirect($url);
	}
}
