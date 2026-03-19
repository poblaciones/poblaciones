<?php

// Ruta al .gpkg
define('GPKG_PATH', "C:/DEMs Argentina/DEMs por provincias 30Mts ign/Provincias/Procesamiento hillshade/paso 4. hacer tiles/pais_3857.gpkg");

$z = isset($_GET['z']) ? (int) $_GET['z'] : null;
$x = isset($_GET['x']) ? (int) $_GET['x'] : null;
$y = isset($_GET['y']) ? (int) $_GET['y'] : null;
$path_info = '';
// Si no hay parámetros GET, intentar extraer de la ruta
if ($z === null || $x === null || $y === null) {

	if (isset($_SERVER['PATH_INFO'])) {
		$path_info = $_SERVER['PATH_INFO'];
	} elseif (isset($_SERVER['QUERY_STRING']) && preg_match('/^\/\d+\/\d+\/\d+/', $_SERVER['QUERY_STRING'])) {
		$path_info = $_SERVER['QUERY_STRING'];
	} elseif (isset($_SERVER['REQUEST_URI'])) {
		// Extraer la parte después del nombre del script
		$script_name = $_SERVER['SCRIPT_NAME'];
		$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
		$p = strpos($request_uri, '/', 2);
		$path_info = substr($request_uri, $p);
	}
	// Patrón para extraer z/x/y de la ruta, ignorando el sufijo @2x.png
	if (preg_match('/^\/(\d+)\/(\d+)\/(\d+)(@\d+x\.png)?$/', $path_info, $matches)) {
		$z = (int) $matches[1];
		$x = (int) $matches[2];
		$y = (int) $matches[3];
	}
}

if ($z === null || $x === null || $y === null) {
	header("HTTP/1.1 400 Bad Request");
	echo "Faltan parámetros z, x o y.";
	exit;
}

// Invertir Y para TMS (igual que MBTiles)
$y_flipped = (1 << $z) - 1 - $y;

try {
	$db = new PDO('sqlite:' . GPKG_PATH);

	$tile_table = 'tiles';
	// Obtener el tile de la tabla correspondiente
	$stmt = $db->prepare("SELECT tile_data FROM `$tile_table` WHERE zoom_level = :z AND tile_column = :x AND tile_row = :y");
	$stmt->bindValue(':z', $z, PDO::PARAM_INT);
	$stmt->bindValue(':x', $x, PDO::PARAM_INT);
	$stmt->bindValue(':y', $y, PDO::PARAM_INT);
	$stmt->execute();

	$tile = $stmt->fetchColumn();

	if (!$tile) {
		/*
		if (!$tile) {
			// DEBUG - Ver qué hay en la base de datos
			$debug_stmt = $db->prepare("SELECT COUNT(*) FROM `$tile_table` WHERE zoom_level = :z");
			$debug_stmt->bindValue(':z', $z, PDO::PARAM_INT);
			$debug_stmt->execute();
			$count_at_zoom = $debug_stmt->fetchColumn();

			$debug_stmt2 = $db->prepare("SELECT MIN(tile_column), MAX(tile_column), MIN(tile_row), MAX(tile_row) FROM `$tile_table` WHERE zoom_level = :z");
			$debug_stmt2->bindValue(':z', $z, PDO::PARAM_INT);
			$debug_stmt2->execute();
			$bounds = $debug_stmt2->fetch(PDO::FETCH_NUM);

			header("HTTP/1.1 404 Not Found");
			echo "Tile no encontrado.\n";
			echo "Buscando: z=$z, x=$x, y=$y\n";
			echo "Tiles en zoom $z: $count_at_zoom\n";
			if ($bounds) {
				echo "Rango en zoom $z: col {$bounds[0]}-{$bounds[1]}, row {$bounds[2]}-{$bounds[3]}\n";
			}
			exit;
		}
		*/
		header("HTTP/1.1 404 Not Found");
		echo "Tile no encontrado.";
		echo "SELECT tile_data FROM `$tile_table` WHERE zoom_level = :z AND tile_column = :x AND tile_row = :y";
		echo '<p>z: ' . $z;
		echo '<p>y: ' . $y;
		echo '<p>x: ' . $x;

		exit;
	}

	// Detectar mime
	$finfo = finfo_open(FILEINFO_MIME_TYPE);
	$mime = finfo_buffer($finfo, $tile);
	finfo_close($finfo);

	// Crear ETag basado en fecha de modificación del .gpkg
	$last_modified = filemtime(GPKG_PATH);
	$etag = md5($last_modified . "_$z-$x-$y");

	// Cabeceras para caché
	header("Etag: \"$etag\"");
	header("Cache-Control: public, max-age=31536000"); // 1 año
	header("Last-Modified: " . gmdate("D, d M Y H:i:s", $last_modified) . " GMT");

	if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === "\"$etag\"") {
		header("HTTP/1.1 304 Not Modified");
		exit;
	}

	// Devolver la imagen
	header("Content-Type: $mime");
	echo $tile;

} catch (Exception $e) {
	header("HTTP/1.1 500 Internal Server Error");
	echo "Error al acceder al GPKG: " . $e->getMessage();
}
?>