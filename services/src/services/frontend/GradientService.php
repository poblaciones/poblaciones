<?php

namespace helena\services\frontend;

use minga\framework\IO;
use minga\framework\Profiling;
use helena\classes\App;

use helena\services\common\BaseService;

class GradientService extends BaseService
{
	public function GetGradient($gradientId, $gradientLimit, $gradientType, $gradientLuminance, $x, $y, $z)
	{
		Profiling::BeginTimer();
		$data = ['Data' => null, 'ImageType' => null];
		if ($z > $gradientLimit)
		{
			// Obtiene la imagen como una subimagen
			$deltaZ = $z - $gradientLimit;
			$newX = (int) ($x / pow(2, $deltaZ));
			$newY = (int) ($y / pow(2, $deltaZ));
			$newZ = 11;
			$newSize = 256 / pow(2, $deltaZ);
			$offsetX = 256 * (($x / pow(2, $deltaZ)) - $newX);
			$offsetY = 256 * (($y / pow(2, $deltaZ)) - $newY);
			// genera la imagen de salida
			$container = $this->GetImageFromDb($gradientId, $newX, $newY, $newZ);
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
