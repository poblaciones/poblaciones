<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\admin as services;
use helena\entities\backoffice as entities;
use minga\framework\Params;

// ********************************* Servicios *********************************

App::$app->get('/services/admin/GetRevisions', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$controller = new services\RevisionService();
	$ret = $controller->GetRevisions();
	return App::OrmJson($ret);
});

App::Post('/services/admin/UpdateRevision', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;

	$revision = App::ReconnectJsonParamMandatory(entities\Revision::class, 'r');
	$controller = new services\RevisionService();
	return App::OrmJson($controller->UpdateRevision($revision));
});

App::Post('/services/admin/DeleteRevision', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;

	$revision = App::ReconnectJsonParamMandatory(entities\Revision::class, 'r');
	$controller = new services\RevisionService();
	return $controller->DeleteRevision($revision);
});

