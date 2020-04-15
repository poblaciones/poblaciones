<?php

namespace helena\services\frontend;

use minga\framework\IO;
use minga\framework\Profiling;
use helena\classes\Paths;

use helena\services\common\BaseService;

class FileSystemTileService extends BaseService
{
	private static $gradient = "ar-2010.gpkg";

	public function GetAlphaImg($geographyId, $x, $y, $z)
	{
		$data = $this->GetAlpha($geographyId, $x, $y, $z);
		header('Content-type: image/jpeg');
    header('Access-Control-Allow-Origin: *');
		echo base64_decode( $data['Data']);
		exit;
	}

	public function GetAlpha($geographyId, $x, $y, $z)
	{
		return $this->GetAlphaFromSqlite($geographyId, $x, $y, $z);
	}

	public function GetAlphaFromSqlite($geographyId, $x, $y, $z)
	{
		Profiling::BeginTimer();
		$data = [];
		// Limit: 11
		$limit = 11;
		if ($z > $limit)
		{
			// Obtiene la imagen como una subimagen
			$deltaZ = $z - $limit;
			$newX = (int) ($x / pow(2, $deltaZ));
			$newY = (int) ($y / pow(2, $deltaZ));
			$newZ = 11;
			$newSize = 256 / pow(2, $deltaZ);
			$offsetX = 256 * (($x / pow(2, $deltaZ)) - $newX);
			$offsetY = 256 * (($y / pow(2, $deltaZ)) - $newY);
			// genera la imagen de salida
			$container = $this->GetImageFromSqlite($geographyId, $newX, $newY, $newZ);
			// listo
			if ($container)
			{
				$im = imagecreatefromstring($container);
				$target = imagecreate($newSize, $newSize);
				imagecopy($target, $im, 0, 0, $offsetX, $offsetY, $newSize, $newSize);
				$stream = fopen("php://memory", "w+");
				imagejpeg($target, $stream);
				rewind($stream);
				$res = stream_get_contents($stream);
				$data['Data'] = base64_encode($res);
				imagedestroy($target);
				imagedestroy($im);
			}
			else
				$data['Data'] = null;
		}
		else
		{
			$res = $this->GetImageFromSqlite($geographyId, $x, $y, $z);
			if (!$res)
				$data['Data'] = null;
			else
				$data['Data'] = base64_encode($res);
		}
		Profiling::EndTimer();
		return $data;
	}

	private function GetImageFromSqlite($geographyId, $x, $y, $z)
	{
		$path = Paths::GetGradientsFolder() . "/" . self::$gradient;
		$db = new \SQLite3($path, SQLITE3_OPEN_READONLY);
		$db->enableExceptions(true);
		$args = array($x, $y, $z);
		$sql = "SELECT tile_data FROM tiles WHERE tile_column = :p1
								AND tile_row = :p2 AND zoom_level = :p3";
		$statement = $db->prepare($sql);
		$n = 1;
		foreach($args as $arg)
			$statement->bindValue(':p' . ($n++), $arg);
		$result = $statement->execute();

		$res = $result->fetchArray(SQLITE3_NUM);
		if ($res == false)
			return null;
		else
			return $res[0];
	}

	public function GetAlphaFromFileSystem($geographyId, $x, $y, $z)
	{
		$data = Array();
		$y = pow(2, $z) - $y - 1;
		$file = Paths::GetGradientsFolder() . "/" . self::$gradient . '/' . $z . '/' . $x . '/' . $y . '.jpg';
		if (file_exists($file))
			$data['Data'] = base64_encode(IO::ReadAllBytes($file));
		else
			$data['Data'] = null;
		return $data;
	}
}

