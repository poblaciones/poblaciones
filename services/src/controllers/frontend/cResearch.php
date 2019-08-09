<?php
namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Mail;
use helena\classes\App;
use minga\framework\MessageException;

class cResearch extends cPublicController
{
	private $success = false;

	public function Show()
	{
		if ($this->success)
			$this->AddValue('showMessage', true);

		$this->AddValue('maps_feedback_url_post', "/research");


		return $this->Render('research.html.twig');
  }


	public function Post()
	{

	}
}
