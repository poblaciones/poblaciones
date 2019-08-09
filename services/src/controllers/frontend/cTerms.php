<?php
namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Mail;
use helena\classes\App;

class cTerms extends cPublicController
{
	public function Show()
	{
		return $this->Render('terms.html.twig');
	}

}


