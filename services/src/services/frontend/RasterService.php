<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\classes\App;
use helena\classes\Paths;
use minga\framework\PublicException;
use minga\framework\ErrorException;

class RasterService extends BaseService
{
	// PNG transparente de 1×1 px, usado cuando no existe el tile solicitado
	private const EMPTY_TILE_BASE64 =
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ' .
		'AABjkB6QAAAABJRU5ErkJggg==';

	public function GetGpkgTile(int $x, int $y, int $z, string $layer): array
	{
		$gpkgPath = $this->resolveGpkgPath($layer);
		$tmsY = (1 << $z) - 1 - $y;
		try {
			$db = new \PDO('sqlite:' . $gpkgPath);
			$db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
			$sql = 'SELECT tile_data FROM tiles
				 WHERE zoom_level = :z AND tile_column = :x AND tile_row = :y';
			$stmt = $db->prepare($sql);
			$stmt->bindValue(':z', $z, \PDO::PARAM_INT);
			$stmt->bindValue(':x', $x, \PDO::PARAM_INT);
			$stmt->bindValue(':y', $tmsY, \PDO::PARAM_INT);

			$stmt->execute();

			$tile = $stmt->fetchColumn();
//			print_r(['x' => $x, 'y' => $tmsY, 'z' => $z, 'sql' => $sql, 'tile' => $tile]);
	//		exit;
		} catch (\Exception $e) {
			throw new ErrorException('Error al acceder al GPKG: ' . $e->getMessage() . '<p>' . $gpkgPath);
		}

		if (!$tile) {
			return $this->emptyTile();
		}

		$finfo = finfo_open(FILEINFO_MIME_TYPE);
		$mime = finfo_buffer($finfo, $tile);
		finfo_close($finfo);

		return [
			'data' => $tile,
			'mime' => $mime,
		];
	}

	// ------------------------------------------------------------------

	private function resolveGpkgPath(string $layer): string
	{
		$rasters = App::Settings()->Map()->Rasters;
		$path = Paths::GetRasterFolder() . '/';

		foreach ($rasters as $raster) {
			if (
				isset($raster['Type'], $raster['Name'], $raster['File']) &&
				$raster['Type'] === 'Gpkg' &&
				$raster['Name'] === $layer
			) {
				return $path . $raster['File'];
			}
		}

		throw new PublicException("No se encontró un raster de tipo Gpkg con nombre '$layer'.");
	}

	private function emptyTile(): array
	{
		return [
			'data' => base64_decode(self::EMPTY_TILE_BASE64),
			'mime' => 'image/png',
		];
	}
}