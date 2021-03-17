<?php

use Symfony\Component\HttpFoundation\Request;

use helena\classes\App;
use minga\framework\IO;
use minga\framework\Context;
use minga\framework\WebConnection;
use helena\classes\Session;
use helena\services\common as services;

function resolver($request)
{
	$uri = $request->server->get('REQUEST_URI');
	$wc = new WebConnection();
	$wc->Initialize();
	$port = Context::Settings()->Map()->LoopLocalPort;
	$ret = $wc->Get('http://localhost:' . $port . $uri);
	if ($ret->error)
	{
		$status = 500;
		$content = "<h2>Poblaciones dev-proxy. No se ha podido redireccionar el pedido</h2><p>La respuesta recibida fue: <br><li>"
								 . $ret->error . "<h3>Verifique que el servidor NPM se encuentre iniciado";
		$type = "text/html";
	}
	else
	{
		$status = 200;
		$content = IO::ReadAllText($ret->file);
		$type = $ret->contentType;
	}
	$wc->Finalize();
	IO::Delete($ret->file);
	return App::Response($content, $type, $status);
}

App::$app->get('/__webpack_hmr', function (Request $request) {
	return resolver($request);
});

App::$app->get('/static/{any}', function (Request $request) {
	return resolver($request);
})->assert("any", ".*");

App::$app->get('/{any}', function (Request $request) {
	return resolver($request);
})->assert("any", ".*\.js$");


App::$app->get('/map/{any}', function (Request $request) {
	return resolver($request);
})->assert("any", ".*");

App::$app->get('/users/{any}', function (Request $request) {
	return resolver($request);
})->assert("any", ".*");

App::$app->get('/admins/{any}', function (Request $request) {
	return resolver($request);
})->assert("any", ".*");

App::$app->get('/users', function (Request $request) {
	return resolver($request);
});
App::$app->get('/admins', function (Request $request) {
	return resolver($request);
});


App::$app->get('/', function (Request $request) {
	return resolver($request);
});

App::$app->get('/map', function (Request $request) {
	return resolver($request);
});

App::$app->get('/appBackoffice.js', function (Request $request) {
	return resolver($request);
});
App::$app->get('/appAdmin.js', function (Request $request) {
	return resolver($request);
});

App::$app->get('/app.js', function (Request $request) {
	return resolver($request);
});