<?php

namespace helena\services\frontend;

use minga\framework\oauth\OauthData;
use minga\framework\PhpSession;
use minga\framework\Str;
use helena\classes\Account;
use helena\classes\App;
use helena\classes\RegisterUser;
use helena\classes\Remember;
use helena\classes\Session;
use helena\db\frontend\UserModel;
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
		$model = new UserModel();
		$ret = $model->GetUserLinkDb($user, $code);
		if ($ret == null)
			return ['status' => self::ERROR, 'message' => ('El c�digo no es v�lido.')];

		$account = new Account();
		$account->user = $user;

		$ret = RegisterUser::doCheckNewPassword($password);
		if ($ret['status'] == self::ERROR)
			return $ret;
		$account->SavePassword($password);
		// Destroy link
		$model->DeleteUserLink($user, $code);

		// Inicia sesi�n como ese usuario
		$account->Begin();
		return ['status' => self::OK];
	}

	public function ValidateCode(string $user, int $code) : array
	{
		$res = $this->LoadAndValidateAccount($user);
		if ($res['status'] == self::ERROR)
			return $res;

		$model = new UserModel();
		$ret = $model->GetUserLinkDb($user, $code);
		if ($ret == null)
			return ['status' => self::ERROR, 'message' => ('El c�digo no es v�lido.')];

		return ['status' => self::OK, 'type' => $ret['type']];
	}

	public function Login(string $user, string $password) : array
	{
		$res = self::LoadAndValidateAccount($user, true);
		if ($res['status'] == self::ERROR)
			return $res;

			$account = $res['account'];

		if ($account->Login($password) == false)
			return ['status' => self::ERROR, 'message' => ('Contrase�a incorrecta.')];

		Remember::SetRemember($account);

		return ['status' => self::OK];
	}

	public function BeginActivation(string $user, string $to) : array
	{
		if(RegisterUser::CompleteOauthRegistration())
		{
			$data = OauthData::DeserializeFromSession();
			if($data == null)
				return ['status' => self::ERROR, 'message' => ('Informaci�n incompleta.')];

			$returnUrl = PhpSession::GetSessionValue($data->provider . 'OauthReturnUrl');
			return ['status' => self::OK, 'returnUrl' => $returnUrl];
		}

		$account = new Account();
		$user = Str::ToLower(trim($user));
		if ($user == "")
			return ['status' => self::ERROR, 'message' => ('No se indic� una direcci�n de correo electr�nico.')];
		if (Str::IsEmail($user) == false)
			return ['status' => self::ERROR, 'message' => ('La direcci�n de correo electr�nico no fue indicada correctamente.')];

		$account->user = $user;

		// Manda el mail de activaci�n
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
		$model = new UserModel();
		$link = $model->GetUserLinkDb($user, $code);
		if ($link == null)
			return ['status' => self::ERROR, 'message' => ('El c�digo no es v�lido.')];

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
			return ['status' => self::ERROR, 'message' => 'La direcci�n de correo electr�nico no fue indicada correctamente.'];

		$account = new Account();
		$account->user = $user;
		if ($account->Exists() == false)
			return ['status' => self::ERROR, 'message' => 'Cuenta inexistente (' . $user . ').'];

		if($shouldBeActive && $account->IsActive() == false)
			return ['status' => self::ERROR, 'message' => 'La cuenta debe ser activada antes de poder ser utilizada. Verifique en su casilla de correo por el mensaje de activaci�n.'];

		//TODO: par�metro account
		return ['status' => self::OK, 'account' => $account];
	}
}
