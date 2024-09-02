<?php

use helena\classes\App;
use helena\classes\GlobalTimer;

function endsWith($string, $endString)
{
    $len = strlen($endString);
    if ($len == 0) {
        return true;
    }
    return (substr($string, -$len) === $endString);
}

function serveStaticFiles()
{
	// Define la ruta base para los archivos estáticos
	$realDir = "/var/www/html/storage/app/web";

	// Obtén la URI del archivo solicitado
	$requestUri = $_SERVER['REQUEST_URI'];

	// Verifica si la solicitud comienza con "/static"
	if (strpos($requestUri, '/static') === 0) {
		// Construye la ruta completa del archivo
		$file = $realDir . parse_url($requestUri, PHP_URL_PATH);

		// Verifica si el archivo existe
		if (file_exists($file) && is_readable($file)) {
			// Obtén el tipo de contenido del archivo
			$mimeType = mime_content_type($file);

			// Envía las cabeceras HTTP adecuadas
			if (endsWith($file, ".css"))
				$mimeType = 'text/css';

			header('Content-Type: ' . $mimeType);
			header('Content-Length: ' . filesize($file));

			// Envía el contenido del archivo
			readfile($file);
			return true;
		} else {
			// Archivo no encontrado, envía una respuesta 404
			header("HTTP/1.0 404 Not Found");
			echo $file;
			echo "404 Not Found";
			return true;
		}
	}
}

// Llama a la función para servir archivos estáticos
if (!serveStaticFiles()) {

	require_once '/var/www/html/storage/app/web/index.php';
}