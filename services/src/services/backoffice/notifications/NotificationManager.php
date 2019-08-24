<?php

namespace helena\services\backoffice\notifications;

use minga\framework\Mail;

use helena\classes\App;
use helena\classes\Links;
use helena\classes\Account;
use minga\framework\Context;
use helena\entities\backoffice as entities;


class NotificationManager
{
	public function NotifyCreate($work)
	{
		if (empty(Context::Settings()->Mail()->NotifyAddress))
			return;
		// Manda email....
		$type = $work->getType();
		$mail = new Mail();
		$mail->to = Context::Settings()->Mail()->NotifyAddress;
		$user = $this->getCurrentUserMessagePart();
		$named = $this->addQuote($work->getMetadata()->getTitle());;
		if ($type == "P")
		{
			$mail->subject = 'Nuevos datos públicos en Poblaciones';
			$message = $user . 'creado nuevos datos públicos en Poblaciones llamados ' . $named;
		}
		else
		{
			$mail->subject = 'Nueva cartografía en Poblaciones';
			$message = $user . 'creado una nueva cartografía en Poblaciones llamada ' . $named;
		}
		$vals = array();
		$vals['title'] = "";
		$vals['message'] = $message;
		$vals['url'] = Links::GetBackofficeWorkUrl($work->getId());
		$mail->message = App::RenderMessage('createNotification.html.twig', $vals);
		$mail->Send(false, true);
	}

	public function NotifyPublish($workId)
	{
		if (empty(Context::Settings()->Mail()->NotifyAddress))
			return;
		// Manda email....
		$work = App::Orm()->find(entities\DraftWork::class, $workId);

		$type = $work->getType();
		$mail = new Mail();
		$mail->to = Context::Settings()->Mail()->NotifyAddress;
		$user = $this->getCurrentUserMessagePart();
		$named = $this->addQuote($work->getMetadata()->getTitle());;
		if ($type == "P")
		{
			$mail->subject = 'Datos públicos publicados en Poblaciones';
			$message = $user . 'publicado los datos públicos llamados ' . $named;
		}
		else
		{
			$mail->subject = 'Cartografía publicada en Poblaciones';
			$message = $user . 'publicado la cartografía llamada ' . $named;
		}
		$vals = array();
		$vals['title'] = "";
		$vals['message'] = $message;
		$metadata = $work->getMetadata();
		$vals['url'] = Context::Settings()->GetPublicUrl() . $metadata->getUrl();
		$mail->message = App::RenderMessage('publishNotification.html.twig', $vals);
		$mail->Send(false, true);
	}


	public function NotifyRequestReview($workId)
	{
		if (empty(Context::Settings()->Mail()->NotifyAddress))
			return;
		// Manda email....
		$work = App::Orm()->find(entities\DraftWork::class, $workId);

		$type = $work->getType();
		$mail = new Mail();
		$mail->to = Context::Settings()->Mail()->NotifyAddress;
		$user = $this->getCurrentUserMessagePart();
		$named = $this->addQuote($work->getMetadata()->getTitle());;
		$mail->subject = 'Solicitud de revisión en Poblaciones';
		if ($type == "P")
		{
			$message = $user . 'solicitado la revisión de sus datos públicos llamados ' . $named;
		}
		else
		{
			$message = $user . 'solicitado la revisión de su cartografía llamada ' . $named;
		}
		$vals = array();
		$vals['title'] = "";
		$vals['message'] = $message;
		$vals['url'] = Links::GetBackofficeWorkUrl($workId);
		$mail->message = App::RenderMessage('publishNotification.html.twig', $vals);
		$mail->Send(false, true);
	}


	public function NotifyCreateUser($user, $fullName)
	{
		if (empty(Context::Settings()->Mail()->NotifyAddress))
			return;
		// Manda email....
		$mail = new Mail();
		$mail->to = Context::Settings()->Mail()->NotifyAddress;
		$mail->subject = 'Nuevo usuario en Poblaciones';
		$message = 'El usuario ' . $fullName . ' (' . $user . ') ha creado una cuenta en el sitio';
		$vals = array();
		$vals['title'] = "";
		$vals['message'] = $message;
		$vals['url'] = Context::Settings()->GetPublicUrl() . "/admins";
		$mail->message = App::RenderMessage('createNewUser.html.twig', $vals);
		$mail->Send(false, true);
	}

	private function addQuote($cad)
	{
		return "'" . $cad . "'";
	}
	private function getCurrentUserMessagePart()
	{
		$current = Account::Current();

		return "El usuario " . $current->GetFullName() . " (" . $current->user . ") ha ";
	}

}
