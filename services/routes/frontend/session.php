<?php

use Symfony\Component\HttpFoundation\Request;
use helena\services\frontend as services;

use helena\classes\App;
use helena\classes\Session;
use minga\framework\Params;
use helena\entities\frontend\geometries\Frame;
use helena\entities\frontend\geometries\Circle;


// ej. http://mapas/boundaries/GetSelectedBoundary?a=62
App::$app->post('/services/session/UpdateUsage', function (Request $request) {
	$controller = new services\SessionService();
	$navigationId = Params::GetIntMandatory('id');
    $startup = Params::GetJson('i', true);
    $actions = Params::GetJson('a', true);
    $month = Params::GetMandatory('m');
    $summary = Params::GetJson('s', true);
    return $controller->Save($month, $navigationId, $startup, $actions, $summary);
});
