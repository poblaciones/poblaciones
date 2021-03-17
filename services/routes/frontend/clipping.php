<?php

use Symfony\Component\HttpFoundation\Request;

use helena\entities\frontend\geometries\Frame;

use helena\services\frontend as services;

use helena\classes\App;

use minga\framework\Params;

// ej. http://mapas/services/clipping/CreateClipping
App::$app->get('/services/frontend/clipping/CreateClipping', function (Request $request) {
	$controller = new services\ClippingService();
	$frame = Frame::FromParams();
	$levelId = Params::GetInt('a', 0);
	$levelName = Params::Get('n');
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	return App::JsonImmutable($controller->CreateClipping($frame, $levelId, $levelName, $urbanity));
});
