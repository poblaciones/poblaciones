<?php

namespace helena\classes;

use minga\framework\Params;
use minga\framework\oauth\OauthData;
use minga\framework\Str;
use minga\framework\MessageBox;
use minga\framework\PhpSession;

class Register
{
	public static function CheckTerms()
	{
		$terms = Params::SafeGet('reg_terms');
		if ($terms != "on" && OauthData::SessionHasTerms() == false)
		{
			MessageBox::ThrowAndLogMessage('No se han aceptado los términos y condiciones de uso. Presione continuar para regresar al formulario de registración y completar este requisito.');
		}
	}

	public static function CompleteOauthRegistration($validUser = '')
	{
		$data = OauthData::DeserializeFromSession();

		if($data == null)
			return false;

		OauthData::ClearSession();

		$user = $data->email;

		if($validUser != "" && $validUser != $user)
			MessageBox::ThrowMessage('La dirección de correo electrónico de la invitación ('.$validUser.') es distinta a la facilitada a través de ' . Str::Capitalize($data->provider) . ' ('.$user.').
			<p>Para comenzar a utilizar cuenta correspondiente a '.$validUser.' debe realizar alguna de las siguientes acciones:
			<p>&bull; Indicar su nombre completo y una contraseña para esa cuenta.
			<p>&bull; Autorizar el uso de dicha cuenta por medio de un proveedor externo (Google o Facebook).');

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

	public static function CheckNewUser($user, $password, $verification, $firstName, $lastName)
	{
		if ($user == "")
			MessageBox::ThrowBackMessage('No se indicó una dirección de correo electrónico.');
		if (Str::EndsWith($user, '.'))
			MessageBox::ThrowBackMessage('La dirección de correo electrónico no fue indicada correctamente.');

		if ($firstName == "")
			MessageBox::ThrowBackMessage('No se indicó un nombre.');
		if ($lastName == "")
			MessageBox::ThrowBackMessage('No se indicó un apellido.');

		self::CheckNewPassword($password, $verification);
	}

	public static function CheckNewPassword($password, $verification)
	{
		if ($password == "")
			MessageBox::ThrowBackMessage('La contraseña no puede ser nula.');
		if (strlen($password) < 6)
			MessageBox::ThrowBackMessage('La contraseña debe tener al menos 6 caracteres de longitud.');
		if ($verification != $password)
			MessageBox::ThrowBackMessage('La contraseña no coincide con la verificación.');
	}

}
