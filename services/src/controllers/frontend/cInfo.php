<?php
namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Mail;
use helena\classes\App;
use minga\framework\MessageException;

class cInfo extends cPublicController
{
	public function Show()
	{
		if (array_key_exists('success', $_GET))
			$this->AddValue('showMessage', true);

		return $this->Render('info.html.twig');
	}

	public function Post()
	{
		if (array_key_exists('header', $_POST))
			$header = $_POST['header'];
		else
			$header = '';

		$from = trim($_POST['from']);
		$message = trim($_POST['message']);
		if ($message == "") throw new MessageException("Debe indicar un contenido para el mensaje.");

		// Manda email....
		$vals = array();

		$title = "Feedback en Poblaciones";
		$vals['from'] = $from;
		$vals['message'] = $message;
		$vals['footer'] = 3;

		$mail = new Mail();
		$mail->to = 'contacto@poblaciones.org';
		$mail->subject = $title;
		$mail->message = 	App::RenderMessage('feedback.html.twig', $vals);
		$mail->Send();

		return App::Redirect("/feedback.do?success");
	}
}


