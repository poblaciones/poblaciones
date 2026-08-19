<?php

require_once __DIR__ . '/settings.php';

if (!isset($SymbolicRoot) || $SymbolicRoot == '')
{
	echo 'Debe configurarse la variable $SymbolicRoot en un archivo de configuración /settings.php.';
	exit();
}
$target = $SymbolicRoot;

function endsWith($string, $endString)
{
    $len = strlen($endString);
    if ($len == 0) {
        return true;
    }
    return (substr($string, -$len) === $endString);
}

function serveStaticFiles($target)
{
	// Define la ruta base para los archivos estáticos, resuelta de forma canónica
	$realDir = realpath($target);
	if ($realDir === false) {
		return false;
	}

	// Obtén la URI del archivo solicitado, sin query string
	$requestUri = $_SERVER['REQUEST_URI'];
	$path = parse_url($requestUri, PHP_URL_PATH);
	if ($path === null || $path === false) {
		return false;
	}

	// Decodifica antes de evaluar, para no dejar pasar secuencias percent-encoded
	$path = rawurldecode($path);

	// Verifica si la solicitud corresponde a los prefijos servidos estáticamente
	if (strpos($path, '/static') !== 0 && strpos($path, '/favicon') !== 0) {
		return false;
	}

	// Rechaza cualquier indicio de traversal antes de tocar el filesystem
	if (strpos($path, "\0") !== false || strpos($path, '..') !== false) {
		header("HTTP/1.0 400 Bad Request");
		return true;
	}

	$file = $realDir . $path;
	$realFile = realpath($file);

	// Verifica que el archivo exista, sea legible, y que su ruta resuelta
	// quede efectivamente dentro de $realDir (bloquea symlinks hacia afuera)
	if (
		$realFile === false ||
		!is_file($realFile) ||
		!is_readable($realFile) ||
		strpos($realFile, $realDir . DIRECTORY_SEPARATOR) !== 0
	) {
		header("HTTP/1.0 404 Not Found");
		echo "404 Not Found";
		return true;
	}

	// Obtén el tipo de contenido del archivo
	$mimeType = mime_content_type($realFile);

	// Envía las cabeceras HTTP adecuadas
	if (endsWith($realFile, ".css"))
		$mimeType = 'text/css';
	else if (endsWith($realFile, ".js"))
		$mimeType = 'text/javascript';

	header('Content-Type: ' . $mimeType);
	header('Content-Length: ' . filesize($realFile));

	// Envía el contenido del archivo
	readfile($realFile);
	return true;
}

// Llama a la función para servir archivos estáticos
if (serveStaticFiles($target) == false) {
	require_once $target . '/index.php';
}