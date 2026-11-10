<?php

use Symfony\Component\HttpFoundation\Request;

use helena\entities\frontend\geometries\Frame;
use helena\entities\frontend\geometries\Coordinate;

use helena\services\frontend as services;

use helena\classes\App;

use minga\framework\Params;
use minga\framework\PublicException;

// ej. http://mapas/services/clipping/CreateClipping
App::$app->get('/services/frontend/clipping/CreateClipping', function (Request $request) {
	$controller = new services\ClippingService();
	$frame = Frame::FromParams();
	$levelId = Params::GetInt('a', 0);
	$levelName = Params::Get('n');
	$urbanity = App::SanitizeUrbanity(Params::Get('u'));
	return App::JsonImmutable($controller->CreateClipping($frame, $levelId, $levelName, $urbanity));
});

// ej. http://mapas/services/frontend/clipping/GetRegionItemByLocation?c=-34.6,-58.4
App::$app->get('/services/frontend/clipping/GetRegionItemByLocation', function (Request $request) {
	$controller = new services\ClippingService();
	$coordinate = Coordinate::TextDeserialize(Params::GetMandatory('c'));
	if ($coordinate === null)
		throw new PublicException('La coordenada no es válida.');
	return App::Json($controller->GetRegionItemByLocation($coordinate));
});
