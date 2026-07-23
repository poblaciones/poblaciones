<?php

namespace helena\controllers\admins;

use helena\controllers\common\cPublicController;

class cPacks extends cPublicController
{
	public function Show()
	{
    return $this->Render('packs.html.twig');
  }

}
