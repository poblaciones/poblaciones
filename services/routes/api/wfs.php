<?php

use Symfony\Component\HttpFoundation\Request;
use helena\services\wfs\WfsService;
use helena\classes\App;

// WFS endpoint - compatible con WFS 1.1.0 y 2.0.0
// ej. http://mapas/services/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities
// ej. http://mapas/services/wfs?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=m_6301_v_560401_l_24201&BBOX=-59,-35,-57,-34
App::$app->get('/services/wfs', function (Request $request) {
	$service = new WfsService();
	return $service->Handle();
});
