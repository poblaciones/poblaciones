<?php

namespace helena\tests;

use minga\framework\Context;
use helena\controllers\common\cController;
use helena\classes\Session;
use minga\framework\Mail;
use minga\framework\Date;

class cTestMail extends cController
{
	public function Show()
	{
		if ($app = Session::CheckIsMegaUser())
			return $app;

		$mail = new Mail();
		$mail->to = Context::Settings()->Mail()->NotifyAddressErrors;
		if ($mail->to == null)
			$mail->to = Context::Settings()->Mail()->NotifyAddress;
		if ($mail->to == null)
		{
			$mail->to  = 'pablodg@gmail.com';
			//	return 'Debe haber un NotifyAddress o NotifyAddressErros para utilizar este test.';
		}
		$mail->subject = 'Prueba en Mapas de Acta Académica - ' . Date::FormattedArNow();
		$mail->message =  "Contenido esdrújulo del mail.";
		$mail->Send(false, true);
		return 'Mail enviado con éxito';
	}
}
