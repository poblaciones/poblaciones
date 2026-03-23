<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use minga\framework\Context;
use helena\services\frontend as services;
use minga\framework\Params;

// ej. http://mapas/services/frontend/raster/GetGpkgTile?l=elevation&x=12&y=62&z=10&w=10
App::$app->get('/services/frontend/raster/GetGpkgTile', function (Request $request) {
	$controller = new services\RasterService();

	$layer = Params::GetMandatory('l');
	$x = Params::GetIntMandatory('x');
	$y = Params::GetIntMandatory('y');
	$z = (int) Params::GetFloatMandatory('z');

	$result = $controller->GetGpkgTile($x, $y, $z, $layer);
	$isDevMode = Context::Settings()->Debug()->debug;
	if ($isDevMode)
		return App::Image($result['data'], $result['mime']);
	else
		return App::ImageImmutable($result['data'], $result['mime']);
});