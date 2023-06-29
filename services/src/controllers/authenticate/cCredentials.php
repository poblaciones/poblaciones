<?php

namespace helena\controllers\authenticate;

use helena\controllers\common\cPublicController;

class cCredentials extends cPublicController
{
	public function Show()
	{
    return $this->Render('credentials.html.twig');
  }

}
