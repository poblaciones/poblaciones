<?php

namespace helena\services\api;

use helena\classes\App;
use minga\framework\Str;
use minga\framework\Mail;
use minga\framework\Params;

use helena\services\common\BaseService;

class MailService extends BaseService
{

	public function Send()
	{
		//  Autentica
		$emailKey = App::Settings()->Keys()->RemoteEmailKey;
		$key = Params::SafeServer('HTTP_AUTHORIZATION', 'null');
		if (strlen($emailKey) == 0 || !Str::EndsWith($key, $emailKey))
			return App::ForbiddenResponse();

		// Toma los datos
		$data = json_decode(file_get_contents('php://input'), true);
		$recipients = $data['personalizations'][0];
		if (array_key_exists('to', $recipients))
			$to = $recipients['to'];
		else
			$to = [];
		if (array_key_exists('cc', $recipients))
			$cc = $recipients['cc'];
		else
			$cc = [];
		if (array_key_exists('bcc', $recipients))
			$bcc = $recipients['bcc'];
		else
			$bcc = [];

		$from = $data['from'];
		$subject = $data['subject'];
		$content = $data['content'];
		$contentText = '';
		$contentHtml = '';
		$toFormatted = [];
		$ccFormatted = [];
		$bccFormatted = [];
		foreach($to as $element)
			$toFormatted[] = $element['email'];
		foreach($cc as $element)
			$ccFormatted[] = $element['email'];
		foreach($bcc as $element)
			$bccFormatted[] = $element['email'];

		foreach($content as $contentElement)
		{
			if ($contentElement['type'] == 'text/plain')
				$contentText = $contentElement['value'];
			if ($contentElement['type'] == 'text/html')
				$contentHtml = $contentElement['value'];
		}
		// Arma el mail
		$mail = new Mail();
		$mail->to = $toFormatted;
		$mail->cc = $ccFormatted;
		$mail->bcc = $bccFormatted;
		$mail->from = $from['email'];
		$mail->fromCaption = $from['name'];
		$mail->subject = $subject;
		$mail->message = ($contentHtml != '' ? $contentHtml : $contentText);
		$mail->Send();

		// Responde el ok
		return App::Response("Sent successfuly.", "text/plain", 202);
	}
}

