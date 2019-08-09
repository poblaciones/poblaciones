<?php
namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Mail;
use helena\classes\App;
use minga\framework\MessageException;

class cCommunity extends cPublicController
{
	private $success = false;

	public function Show()
	{
		if ($this->success)
			$this->AddValue('showMessage', true);

		$this->AddValue('maps_feedback_url_post', "/feedback");


		return $this->Render('community.html.twig');
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

		$this->success = true;
		return $this->Show();
	}
}
