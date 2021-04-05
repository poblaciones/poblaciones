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
	return resolverSocket($request);
});


function resolverSocket($request)
{
	$uri = $request->server->get('REQUEST_URI');

	$port = Context::Settings()->Map()->LoopLocalPort;
	socketCall('localhost', $port, $uri, false);
}

function socketCall($server, $port, $url, $includeHeaders)
	{
		$method = 'GET';
		// open conection
		$fp = fsockopen($server, $port, $errno, $errstr, 30);
		if (!$fp) {
		//	$ret->Error = "$errstr ($errno)";
			throw new Exception("$errstr ($errno)");
		}
		$request = $method . " " . $url . " HTTP/1.1
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:29.0) Gecko/20100101 Firefox/29.0
Accept-Encoding: gzip, deflate
Accept-Language: es-ar,es;q=0.8,en-us;q=0.5,en;q=0.3
Pragma: no-cache";
		$request .= "\r\n\r\n";
    fwrite($fp, $request);
		$passedHeaders = false;
    while (!feof($fp)) {
        $response = fgets($fp, 1280);
				if (!$passedHeaders)
				{
					if (strlen($response) < 3)
					{
						$passedHeaders = true;
						break;
					}
					else
					{
						if (substr($response, 0, 4) != "HTTP")
								header($response);
						;
					}
				}
		}
    while (!feof($fp)) {
			$c = fgetc($fp);
			if ($c !== false)
			{
				ob_end_flush();
				echo $c;
				ob_start();
			}
    }
		fclose($fp);
	}

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