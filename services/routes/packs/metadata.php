<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use helena\classes\Session;
use helena\services\packs as services;
use helena\services\backoffice as backofficeServices;
use minga\framework\Params;
use helena\services\backoffice\publish\CacheManager;
use helena\entities\backoffice as entities;

// ********************************* Servicios *********************************

App::Get('/services/packs/GetMetadata', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new services\MetadataService();
	$metadataId = Params::GetIntMandatory('m');
	$ret = $controller->GetMetadata($metadataId);
	return App::OrmJson($ret);
});


App::Get('/services/packs/ClearMetadataPdfCache', function (Request $request) {
	if ($app = Session::CheckIsSiteReader())
		return $app;
	$controller = new CacheManager();
	$metadataId = Params::GetMandatory('m');
	$ret = $controller->CleanPdfMetadata($metadataId);
	return App::Json(["result" => "OK"]);
});

