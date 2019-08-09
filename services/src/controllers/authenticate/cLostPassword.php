<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cController;
use helena\classes\Account;
use helena\classes\App;

use minga\framework\Str;
use minga\framework\Params;

class cLostPassword extends cController
{
	public function Show()
	{
		$to = Params::SafeGet('to');
		$this->AddValue('to', $to);
		return $this->Render('lostPassword.html.twig');
	}
	public function Post()
	{
		$user = Str::ToLower(trim($_POST['username']));

		$account = new Account();
		$account->user = $user;

		$to = Params::SafeGet('to');
		$account->BeginLostPassword($to);

		$message = "<p>
			El mensaje para la recuperación de su contraseña ha sido enviado exitosamente. Para poder recuperar el acceso a Poblaciones es necesario generar una nueva contraseña de acceso.
			</p>
			<p>
			Para que pueda hacer esto, hemos enviado un mensaje a su casilla con un link de activación. Si el mensaje no aparece, verifique
			su bandeja de 'correo no deseado' o 'Spam'.
			</p>
			<p align='center'>
			<b>Busque en su casilla el mensaje que hemos enviado para continuar... </b>
			</p>";
		$title = 'Recuperación de contraseña';

		$this->AddValue('page', $title);
		$this->AddValue('message', $message);
		$this->AddValue('nobutton', true);
		$this->AddValue('action', "document.location='/';");

		$this->AddValue('html_title', $title);
		return $this->Render('message.html.twig');
	}
}