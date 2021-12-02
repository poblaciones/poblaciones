<?php

namespace helena\controllers\backoffice;

use helena\controllers\common\cPublicController;
use minga\framework\Context;

class cBackoffice extends cPublicController
{
	public function Show()
	{
		$this->AddValue('google_maps_key', Context::Settings()->Keys()->GetGoogleMapsKey());

    return $this->Render('backoffice.html.twig');
  }

}
