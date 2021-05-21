<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\admin as services;
use helena\entities\backoffice as entities;
use minga\framework\Params;

// ********************************* Servicios *********************************

App::$app->get('/services/admin/GetReviews', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\ReviewService();
	$ret = $controller->GetReviews();
	return App::OrmJson($ret);
});

App::Post('/services/admin/UpdateReview', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;

	$review = App::ReconnectJsonParamMandatory(entities\Review::class, 'r');
	$controller = new services\ReviewService();
	return App::OrmJson($controller->UpdateReview($review));
});

App::Post('/services/admin/DeleteReview', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;

	$review = App::ReconnectJsonParamMandatory(entities\Review::class, 'r');
	$controller = new services\ReviewService();
	return $controller->DeleteReview($review);
});

