<?php

$isStatic = isStatic();
if ($isStatic)
{
	$uri = $_SERVER['REQUEST_URI'];
	$file = __DIR__. $uri ;
	if (!file_exists($file))
		$file = __DIR__. '/../../frontend' . $uri ;

	Sendfile($file);
	exit;
}
else
{
	require_once __DIR__.'/index.php';
}

function isStatic()
{
	if(!array_key_exists('REQUEST_URI', $_SERVER))
		return false;
	$uri = $_SERVER['REQUEST_URI'];
	return cadStartsWith($uri, '/static') || cadStartsWith($uri, '/favicon');
}
function cadStartsWith($text, $word)
{
	return substr($text, 0, strlen($word)) === $word;
}

function SendFile($filename)
{
	if (!file_exists($filename))
	{
		header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
		header('Status: 404 Not Found');
		echo 'File not found by php-resolve-dev.';
		exit;
	}
	$size = filesize($filename);
	$ext = pathinfo($filename, PATHINFO_EXTENSION);
	$contentType = 'text/plain';
	switch($ext)
	{
		case 'css':
			$contentType = 'text/css';
			break;
		case 'js':
			$contentType = 'application/javascript';
			break;
		case 'ico':
			$contentType = 'image/x-icon';
			break;
	}
	// send the right headers
	header('Content-Type: ' . $contentType);
	header('Content-Length: ' . $size);
	readfile($filename);
}