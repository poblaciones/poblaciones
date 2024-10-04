<?php

use helena\classes\App;
use helena\classes\GlobalTimer;

if (!array_key_exists('REQUEST_URI', $_SERVER))
	$uri = '';
else
	$uri = $_SERVER['REQUEST_URI'];

$isPublic = isPublicPath($uri);
$isLocal = isLocalPHP($uri);

if ($isLocal) {
	// sale ejecutando
	require_once __DIR__ . $uri;
	exit();
}

$startTotalTime = microtime(true);

require_once __DIR__ . '/../startup.php';
time_elapsed('fin startup');
require_once __DIR__ . '/../routes/routes.php';
time_elapsed('fin routes');

GlobalTimer::Start($startTotalTime);

App::$app->run();
time_elapsed('fin run');

//outwrite();

function isLocalPHP($uri)
{
	$parts = explode('/', $uri);
	return (sizeof($parts) == 2 && file_exists(__DIR__ . $uri)) && endsWithString($uri, '.php');
}

function isPublicPath($uri)
{
	return !startsWith($uri, '/users') && !startsWith($uri, '/logs') && !startsWith($uri, '/services/backoffice/') && !startsWith($uri, '/services/admin/') && !startsWith($uri, '/admins');
}
function startsWith($text, $word)
{
	return substr($text, 0, strlen($word)) === $word;
}

function endsWithString($haystack, $needle)
{
	$length = strlen($needle);
	if ($length == 0)
		return true;
	return substr($haystack, -$length) === $needle;
}