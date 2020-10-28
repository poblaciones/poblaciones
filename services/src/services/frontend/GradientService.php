<?php

namespace helena\services\frontend;

use minga\framework\IO;
use minga\framework\Profiling;
use helena\classes\App;

use helena\services\common\BaseService;

class GradientService extends BaseService
{
	public function GetGradient($gradientId)
	{
		Profiling::BeginTimer();

		$sql = "SELECT * FROM gradient WHERE grd_id = ?";
		$args = array($gradientId);
		$row = App::Db()->fetchAssoc($sql, $args);

		Profiling::EndTimer();
		return $row;
}

	public function GetGradientTile($gradientId, $gradientLimit, $gradientType, $gradientLuminance, $x, $y, $z)
	{
		Profiling::BeginTimer();
		$data = ['Data' => null, 'ImageType' => null];
		if ($z > $gradientLimit)
		{
			// Obtiene la imagen como una subimagen
			$deltaZ = $z - $gradientLimit;
			$sourceX = (int) ($x / pow(2, $deltaZ));
			$sourceY = (int) ($y / pow(2, $deltaZ));
			$sourceZ = $gradientLimit;
			$newSize = 256 / pow(2, $deltaZ);
			$offsetX = 256 * (($x / pow(2, $deltaZ)) - $sourceX);
			$offsetY = 256 * (($y / pow(2, $deltaZ)) - $sourceY);
			// genera la imagen de salida
			$container = $this->GetImageFromDb($gradientId, $sourceX, $sourceY, $sourceZ);
			// listo
			if ($container && $newSize >= 1)
			{
				$im = imagecreatefromstring($container);
				$target = imagecreate($newSize, $newSize);
				imagecopy($target, $im, 0, 0, $offsetX, $offsetY, $newSize, $newSize);
				$stream = fopen("php://memory", "w+");
				imagejpeg($target, $stream);
				rewind($stream);
				$res = stream_get_contents($stream);
				imagedestroy($target);
				imagedestroy($im);
			}
			else
			{
				$res = null;
			}
		}
		else
		{
			$res = $this->GetImageFromDb($gradientId, $x, $y, $z);
		}
		if ($res)
		{
			$data['Data'] = base64_encode($res);
			$data['ImageType'] = $gradientType;
			$data['Luminance'] = $gradientLuminance;
		}
		Profiling::EndTimer();
		return $data;
	}

	private function GetImageFromDb($gradientId, $x, $y, $z)
	{
		Profiling::BeginTimer();

		$sql = "SELECT gri_content FROM gradient_item WHERE gri_gradient_id = ? AND gri_x = ? AND gri_y = ? AND gri_z = ?";
		$args = array($gradientId, $x, $y, $z);

		$content = App::Db()->fetchScalarNullable($sql, $args);

		Profiling::EndTimer();

		return $content;
	}
}

