<?php

namespace helena\controllers\frontend;

use helena\controllers\common\cPublicController;
use minga\framework\Context;

class cMap extends cPublicController
{
	public function Show()
	{
		$this->AddValue('google_maps_key', Context::Settings()->Keys()->GoogleMapsKey);
		$this->AddValue('google_analytics_key', Context::Settings()->Keys()->GoogleAnalyticsKey);
		$this->AddValue('add_this_key', Context::Settings()->Keys()->AddThisKey);

    return $this->Render('index.html.twig');
  }

}
