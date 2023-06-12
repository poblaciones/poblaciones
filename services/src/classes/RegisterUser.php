<?php

namespace helena\classes;

use minga\framework\Params;
use minga\framework\oauth\OauthData;
use minga\framework\Str;
use minga\framework\MessageBox;
use minga\framework\PhpSession;
use helena\services\common\BaseService;


class RegisterUser
{
		public static function CheckTerms() : array
	{
		$terms = Params::SafeGet('reg_terms');
		if ($terms != "on" && OauthData::SessionHasTerms() == false)
		{
			return [
				'status' => BaseService::ERROR,
				'message' => 'No se han aceptado los términos y condiciones de uso. Presione continuar para regresar al formulario de registración y completar este requisito.',
			];
		}
		return ['status' => BaseService::OK];
	}

	public static function CompleteOauthRegistration(string $validUser = '') : bool
	{
		$data = OauthData::DeserializeFromSession();

		if($data == null)
			return false;

		OauthData::ClearSession();

		$user = $data->email;

		//TODO: esto debería ir con throwmessage?
		if($validUser != "" && $validUser != $user)
		{
			MessageBox::ThrowMessage('La dirección de correo electrónico de la invitación (' . $validUser . ') es distinta a la facilitada a través de ' . Str::Capitalize($data->provider) . ' (' . $user . ').
										<p>Para comenzar a utilizar cuenta correspondiente a ' . $validUser . ' debe realizar alguna de las siguientes acciones:</p>
										<p>• su nombre completo y una contraseña para esa cuenta.</p>
										<p>• el uso de dicha cuenta por medio de un proveedor externo (Google o Facebook).</p>'
			);
		}

		$account = new Account();
		$account->user = $user;
		$account->LoadOrCreate();
		// Activa...
		$account->SaveOauthActivation($data);

		// inicia sesión
		if (Session::IsAuthenticated())
			Session::Logoff();

		$account->Begin();
		Remember::SetRemember($account);

		return true;
	}

	public static function CompleteOauthRegistrationTabu($data) : bool
	{
		if($data == null)
			return false;
		OauthData::ClearSession();

		$user = $data->email;
		$account = new Account();
		$account->user = $user;
		$account->LoadOrCreate();
		// Activa...
		$account->SaveOauthActivation($data);

		// TODO: por algo si no hago esto se hace rollback en algo posterior
		App::Orm()->flush();
		App::Db()->commit();

		// inicia sesión
		if (Session::IsAuthenticated())
			Session::Logoff();

		$account->Begin();
		Remember::SetRemember($account);

		return true;
	}

	public static function CheckNewUser(string $user, string $password, string $firstname, string $lastname) : array
	{
		if ($user == "")
			return ['status' => BaseService::ERROR, 'message' => ('No se indicó una dirección de correo electrónico.')];
		if ($firstname == "")
			return ['status' => BaseService::ERROR, 'message' => ('No se indicó un nombre.')];
		if ($lastname == "")
			return ['status' => BaseService::ERROR, 'message' => ('No se indicó un apellido.')];

		if (Str::IsEmail($user) == false)
			return ['status' => BaseService::ERROR, 'message' => ('La dirección de correo electrónico no fue indicada correctamente.')];

		return self::doCheckNewPassword($password);
	}

	public static function CheckNewPassword(string $password) : void
	{
		$ret = self::doCheckNewPassword($password);
		if ($ret['status'] == BaseService::ERROR)
			MessageBox::ThrowBackMessage($ret['message']);
	}

	public static function doCheckNewPassword(string $password) : array
	{
		if ($password == "")
			return ['status' => BaseService::ERROR, 'message' => ('Debe ingresar una contraseña.')];
		if (strlen($password) < 6)
			return ['status' => BaseService::ERROR, 'message' => ('La contraseña debe tener al menos 6 caracteres de longitud.')];
		return ['status' => BaseService::OK];
	}
}
