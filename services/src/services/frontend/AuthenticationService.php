<?php

namespace helena\services\frontend;

use minga\framework\oauth\OauthData;
use minga\framework\PhpSession;
use minga\framework\Str;
use helena\classes\Account;
use helena\classes\App;
use helena\classes\Register;
use helena\classes\Remember;
use helena\classes\Session;
use helena\db\backoffice\SecurityUserModel;
use helena\services\common\BaseService;

class AuthenticationService extends BaseService
{
	public function AccountExists(string $user, bool $shouldBeActive) : array
	{
		return $this->LoadAndValidateAccount($user, $shouldBeActive);
	}

	public function BeginResetPassword(string $user, string $to) : array
	{
		$res = $this->LoadAndValidateAccount($user, true);
		if ($res['status'] == self::ERROR)
			return $res;

			$account = $res['account'];

		return $account->BeginLostPassword($to);
	}

	public function ResetPassword(string $user, string $password, int $code) : array
	{
		$res = $this->LoadAndValidateAccount($user);
		if ($res['status'] == self::ERROR)
			return $res;
		$model = new SecurityUserModel();
		$ret = $model->GetUserLinkDb($user, $code);
		if ($ret == null)
			return ['status' => self::ERROR, 'message' => App::Trans('El código no es válido.')];

		$account = new Account();
		$account->user = $user;

		$ret = Register::doCheckNewPassword($password);
		if ($ret['status'] == self::ERROR)
			return $ret;
		$account->SavePassword($password);
		// Destroy link
		$model->DeleteUserLink($user, $code);

		// Inicia sesión como ese usuario
		$account->Begin();
		return ['status' => self::OK];
	}

	public function ValidateCode(string $user, int $code) : array
	{
		$res = $this->LoadAndValidateAccount($user);
		if ($res['status'] == self::ERROR)
			return $res;

		$model = new SecurityUserModel();
		$ret = $model->GetUserLinkDb($user, $code);
		if ($ret == null)
			return ['status' => self::ERROR, 'message' => App::Trans('El código no es válido.')];

		return ['status' => self::OK, 'type' => $ret['type']];
	}

	public function Login(string $user, string $password) : array
	{
		$res = self::LoadAndValidateAccount($user, true);
		if ($res['status'] == self::ERROR)
			return $res;

			$account = $res['account'];

		if ($account->Login($password) == false)
			return ['status' => self::ERROR, 'message' => App::Trans('Contraseña incorrecta.')];

		Remember::SetRemember($account);

		return ['status' => self::OK];
	}

	public function BeginActivation(string $user, string $to) : array
	{
		if(Register::CompleteOauthRegistration())
		{
			$data = OauthData::DeserializeFromSession();
			if($data == null)
				return ['status' => self::ERROR, 'message' => App::Trans('Información incompleta.')];

			$returnUrl = PhpSession::GetSessionValue($data->provider . 'OauthReturnUrl');
			return ['status' => self::OK, 'returnUrl' => $returnUrl];
		}

		$account = new Account();
		$user = Str::ToLower(trim($user));
		if ($user == "")
			return ['status' => self::ERROR, 'message' => App::Trans('No se indicó una dirección de correo electrónico.')];
		if (Str::IsEmail($user) == false)
			return ['status' => self::ERROR, 'message' => App::Trans('La dirección de correo electrónico no fue indicada correctamente.')];

		$account->user = $user;

		// Manda el mail de activación
		$ret = $account->BeginActivation($to);
		if ($ret['status'] == self::ERROR)
			return $ret;

		// Redirige...
		Session::Logoff();

		// Muestra mensaje
		return ['status' => self::OK];
	}

	public function Activate(string $user, string $password, int $code, string $firstname, string $lastname, string $type) : array
	{
		$model = new SecurityUserModel();
		$link = $model->GetUserLinkDb($user, $code);
		if ($link == null)
			return ['status' => self::ERROR, 'message' => App::Trans('El código no es válido.')];

		$account = new Account();
		$account->user = $user;

		$ret = $account->Activate($code, $password, $firstname, $lastname, $type);
		if($ret['status'] == self::ERROR)
			return $ret;

		// Sale con redirect
		$account->Begin();

		$model->DeleteUserLink($user, $code);

		return ['status' => self::OK, 'target' => $link['to']];
	}

	private function LoadAndValidateAccount(string $user, bool $shouldBeActive = false) : array
	{
		$user = Str::ToLower(trim($user));
		if ($user == "")
			return ['status' => self::ERROR, 'message' => 'Debe indicarse una cuenta para ingresar.'];
		if (Str::IsEmail($user) == false)
			return ['status' => self::ERROR, 'message' => 'La dirección de correo electrónico no fue indicada correctamente.'];

		$account = new Account();
		$account->user = $user;
		if ($account->Exists() == false)
			return ['status' => self::ERROR, 'message' => 'Cuenta inexistente (' . $user . ').'];

		if($shouldBeActive && $account->IsActive() == false)
			return ['status' => self::ERROR, 'message' => 'La cuenta debe ser activada antes de poder ser utilizada. Verifique en su casilla de correo por el mensaje de activación.'];

		//TODO: parámetro account
		return ['status' => self::OK, 'account' => $account];
	}
}
