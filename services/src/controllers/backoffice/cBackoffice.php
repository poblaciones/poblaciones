<?php

namespace helena\controllers\backoffice;

use helena\controllers\common\cPublicController;

class cBackoffice extends cPublicController
{
	public function Show()
	{
    return $this->Render('backoffice.html.twig');
  }

}
