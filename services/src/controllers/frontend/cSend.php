<?php
namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use helena\classes\App;
use minga\framework\MessageException;

use minga\framework\Mail;

class cSend extends cPublicController
{
	public function Show()
	{
		if (array_key_exists('success', $_GET))
			$this->AddValue('showMessage', true);

		$this->useSearchBar = false;

		$this->AddValue('maps_send_url_post', "/send");

		return $this->Render('send.html.twig');
	}


	public function Post()
	{
		if (array_key_exists('header', $_POST))
			$header = $_POST['header'];
		else
			$header = '';

		$from = trim($_POST['from']);
		$message = '';

		foreach($_POST as $key => $value)
			$message .= $key . ': ' . $value . '<p>';

		// TODO FALTA ANEXAR ARCHIVOS

		if ($message == "")
			throw new MessageException("Debe indicar un contenido para el mensaje.");

		// Manda email....
		$vals = array();

		$title = "Geografía recibida en Poblaciones";
		$vals['from'] = $from;
		$vals['message'] = $message;
		$vals['footer'] = 3;

		$mail = new Mail();
		$mail->to = 'contacto@poblaciones.org';
		$mail->subject = $title;
		$mail->message = 	App::RenderMessage('feedback.html.twig', $vals);
		$mail->Send();

		App::Redirect("/mapsFeedback.do?success");
	}
}

