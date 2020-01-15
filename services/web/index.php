<?php

use helena\classes\App;
use helena\classes\GlobalTimer;

$isPublic = isPublicPath();

$startTotalTime = microtime(true);

time_elapsed('inicio');
require_once __DIR__.'/../startup.php';
time_elapsed('fin startup');
require_once __DIR__.'/../routes/routes.php';
time_elapsed('fin routes');

GlobalTimer::Start($startTotalTime);

App::$app->run();
time_elapsed('fin run');

//outwrite();


function time_elapsed($label = null)
{
    static $last = null;
    static $total = null;
    static $round = 1;

    $now = microtime(true);
		if ($last != null) {
        outwrite($round);
				if ($label) outwrite('. ' . $label);
				outwrite(': Parcial: ' . ($now - $last) * 1000 . ' ms');
				outwrite('. Total: ' . ($now - $total) * 1000 . " ms\n<br>");
				$round++;
		} else $total = $now;

    $last = $now;
}

function outwrite($text = null)
{
   static $out = "\n<br>";
	if ($text !== null)
		$out .= $text;
	else
		echo $out;
}

function isPublicPath()
{
	if(!array_key_exists('REQUEST_URI', $_SERVER))
		return false;
	$uri = $_SERVER['REQUEST_URI'];
	return !startsWith($uri, '/users') && !startsWith($uri, '/logs') && !startsWith($uri, '/services/backoffice/') && !startsWith($uri, '/admins');
}
function startsWith($text, $word)
{
	return substr($text, 0, strlen($word)) === $word;
}