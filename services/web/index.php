<?php

use helena\classes\App;
use helena\classes\GlobalTimer;

$isPublic = isPublicPath();
$startTotalTime = microtime(true);

require_once __DIR__.'/../startup.php';
time_elapsed('fin startup');
require_once __DIR__.'/../routes/routes.php';
time_elapsed('fin routes');

GlobalTimer::Start($startTotalTime);

App::$app->run();
time_elapsed('fin run');

//outwrite();



function isPublicPath()
{
	if(!array_key_exists('REQUEST_URI', $_SERVER))
		return false;
	$uri = $_SERVER['REQUEST_URI'];
	return !startsWith($uri, '/users') && !startsWith($uri, '/logs') && !startsWith($uri, '/services/backoffice/') && !startsWith($uri, '/services/admin/') && !startsWith($uri, '/admins');
}
function startsWith($text, $word)
{
	return substr($text, 0, strlen($word)) === $word;
}