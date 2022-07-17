<?php

namespace helena\controllers\backoffice;

use helena\controllers\common\cPublicController;
use minga\framework\Context;
use helena\classes\App;

class cBackoffice extends cPublicController
{
	public function Show()
	{
		$this->AddValue('google_maps_key', Context::Settings()->Keys()->GetGoogleMapsKey());
		$this->AddValue('maps_api', App::Settings()->Map()->MapsAPI);

    return $this->Render('backoffice.html.twig');
  }

}
