<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\packs as services;
use minga\framework\Params;
use helena\entities\backoffice as entities;


// ********************************* Servicios *********************************

App::Get('/services/packs/GetMetricGroups', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\MetricGroupService();
	$ret = $controller->GetMetricGroups();
	return App::OrmJson($ret);
});

App::GetOrPost('/services/packs/UpdateMetricGroup', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$metricGroup = App::ReconnectJsonParamMandatory(entities\MetricGroup::class, 'g');

	$controller = new services\MetricGroupService();
	$ret = $controller->UpdateMetricGroup($metricGroup);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/DeleteMetricGroup', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$metricGroupId = Params::GetIntMandatory('g');
	$metricGroup = App::Orm()->find(entities\MetricGroup::class, $metricGroupId);

	$controller = new services\MetricGroupService();
	$ret = $controller->DeleteMetricGroup($metricGroup);
	return App::Json($ret);
});

App::Get('/services/packs/GetMetricProviders', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\MetricProviderService();
	$ret = $controller->GetMetricProviders();
	return App::OrmJson($ret);
});

App::GetOrPost('/services/packs/UpdateMetricProvider', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$metricProvider = App::ReconnectJsonParamMandatory(entities\MetricProvider::class, 'p');

	$controller = new services\MetricProviderService();
	$ret = $controller->UpdateMetricProvider($metricProvider);
	return App::Json($ret);
});

App::GetOrPost('/services/packs/DeleteMetricProvider', function (Request $request) {
	if ($app = Session::CheckIsMegaUser())
		return $app;
	$metricProviderId = Params::GetIntMandatory('p');
	$metricProvider = App::Orm()->find(entities\MetricProvider::class, $metricProviderId);

	$controller = new services\MetricProviderService();
	$ret = $controller->DeleteMetricProvider($metricProvider);
	return App::Json($ret);
});
