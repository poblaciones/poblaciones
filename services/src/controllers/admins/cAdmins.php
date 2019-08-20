<?php

namespace helena\controllers\admins;

use helena\controllers\common\cPublicController;

class cAdmins extends cPublicController
{
	public function Show()
	{
    return $this->Render('admins.html.twig');
  }

}
