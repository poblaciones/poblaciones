<?php

use Symfony\Component\HttpFoundation\Request;
use helena\services\api as services;

use helena\classes\App;
use minga\framework\Params;

// ej. http://mapas/services/api/getCapabilities
App::$app->get('/services/api/getCapabilities', function (Request $request) {

	$controller = new services\ClippingService();
	$version = Params::GetInt('v');
	$controller->CheckVersion($version);

	$ret = [];
	$sampleId = 7314;
	$sampleQuery = 'catamar';
	/*
	$sampleType = 'Provincias';

	$ret[] = [ 'url' => App::AbsoluteUrl('/services/api/regions/getTypes'),
						'demo' => App::AbsoluteUrl('/services/api/regions/getTypes?v=1'),
						'description' => 'Returns all available types of regions',
						'parameters' => [[ 'name' => 'v',
															'description' => 'API version',
															'mandatory' => 'yes',
															'sample value' => '1']]];
	$ret[] = [ 'url' => App::AbsoluteUrl('/services/api/regions/list'),
							'demo' => App::AbsoluteUrl('regions/list?v=1&type=' . $sampleType),
											'description' => 'Returns all available features for a give type',
											'parameters' => [[ 'name' => 'v',
																				'description' => 'API version',
																				'mandatory' => 'yes',
																				'sample value' => '1'],
																				[ 'name' => 'type',
																				'description' => 'Name of the type of entities to list',
																				'mandatory' => 'yes',
																				'sample value' => 'Provincias']]];
																				*/
	$ret[] = [ 'url' => App::AbsoluteUrl('/services/api/regions/getFeature'),
							'demo' => App::AbsoluteUrl('regions/getFeature?v=1&id=' . $sampleId),
											'description' => 'Returns all atributes of a features by id',
											'parameters' => [[ 'name' => 'v',
																				'description' => 'API version',
																				'mandatory' => 'yes',
																				'sample value' => '1'],
																				[ 'name' => 'id',
																				'description' => 'id of the feature as returned by the list and search APIs',
																				'mandatory' => 'yes',
																				'sample value' => 251]]];
	$ret[] = [ 'url' => App::AbsoluteUrl('/services/api/regions/search'),
							'demo' => App::AbsoluteUrl('regions/search?v=1&q=' . $sampleQuery),
											'description' => 'Returns all entities matching a free text expression',
											'parameters' => [[ 'name' => 'v',
																				'description' => 'API version',
																				'mandatory' => 'yes',
																				'sample value' => '1'],
																				[ 'name' => 'q',
																				'description' => 'Free text expression to query regions',
																				'mandatory' => 'yes',
																				'sample value' => 'departamento de san ignacio']]];

	return App::Json($ret);
});


// ej. http://mapas/services/api/regions/getFeature?id=12
App::$app->get('/services/api/regions/getFeature', function (Request $request) {
	$controller = new services\ClippingService();
	$version = Params::GetIntMandatory('v');
	$id = Params::GetIntMandatory('id');

	$ret = $controller->GetFeature($version, $id);
	return App::Json($ret);
});

// ej. http://mapas/services/api/regions/search?q=
App::$app->get('/services/api/regions/search', function (Request $request) {
	$controller = new services\ClippingService();
	$version = Params::GetIntMandatory('v');
	$q = Params::GetMandatory('q');

	$ret = $controller->Search($version, $q);
	return App::Json($ret);
});

