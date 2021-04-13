<?php

namespace helena\classes;

use minga\framework\IO;

class Image
{
	public static function GetImageMimeType($filename)
	{
		return image_type_to_mime_type(self::GetImageType($filename));
	}
	public static function GetImageType($filename)
	{
		return exif_imagetype($filename);
	}
	public static function GetImageSize($filename)
	{
		$size = getimagesize($filename);
		return ['width' => $size[0], 'height' => $size[1]];
	}
	public static function LoadImage($filename)
	{
		$imageType = self::GetImageType($filename);
		switch($imageType)
		{
			case IMAGETYPE_GIF:
				return imagecreatefromgif ($filename);
			case IMAGETYPE_JPEG:
				return imagecreatefromjpeg ($filename);
			case IMAGETYPE_PNG:
				return imagecreatefrompng ($filename);
			case IMAGETYPE_SWF:
			case IMAGETYPE_PSD:
			case IMAGETYPE_BMP:
			case IMAGETYPE_TIFF_II:
			case IMAGETYPE_TIFF_MM:
			case IMAGETYPE_JPC:
			case IMAGETYPE_JP2:
			case IMAGETYPE_JPX:
			case IMAGETYPE_JB2:
			case IMAGETYPE_SWC:
			case IMAGETYPE_IFF:
			case IMAGETYPE_WBMP:
			case IMAGETYPE_XBM:
			case IMAGETYPE_ICO:
			case IMAGETYPE_WEBP:
				return imagecreatefromstring(file_get_contents($filename));
		}
		throw new \Exception("Invalid image type");
	}
	public static function SaveImage($filename, $image, $imageType)
	{
		switch($imageType)
		{
			case IMAGETYPE_GIF:
				imagegif ($image, $filename);
				break;
			case IMAGETYPE_JPEG:
				imagejpeg ($image, $filename);
				break;
			case IMAGETYPE_SWF:
			case IMAGETYPE_PSD:
			case IMAGETYPE_BMP:
			case IMAGETYPE_TIFF_II:
			case IMAGETYPE_TIFF_MM:
			case IMAGETYPE_JPC:
			case IMAGETYPE_JP2:
			case IMAGETYPE_JPX:
			case IMAGETYPE_JB2:
			case IMAGETYPE_SWC:
			case IMAGETYPE_IFF:
			case IMAGETYPE_WBMP:
			case IMAGETYPE_XBM:
			case IMAGETYPE_ICO:
			case IMAGETYPE_WEBP:
			case IMAGETYPE_PNG:
				imagepng ($image, $filename);
			break;
		}
	}

	public static function ResizeToMaxSize($filename, ?int $maxWidth = null, ?int $maxHeight = null)
	{
	$size = self::GetImageSize($filename);
		$width = $size['width'];
		$height = $size['height'];

		if (($maxWidth === null || $maxWidth >= $width) &&
				($maxHeight === null || $maxHeight >= $height))
				return;

		$w = ($maxWidth === null ? $width : $maxWidth);
		$h = ($maxHeight === null ? $height : $maxHeight);
    $r = $width / $height;
    if ($w/$h > $r) {
        $newwidth = $h*$r;
        $newheight = $h;
    } else {
        $newheight = $w/$r;
        $newwidth = $w;
    }
		self::ResizeToSize($filename, $newwidth, $newheight);
	}

	public static function ResizeToSize($filename, int $newwidth, int $newheight)
	{
		$imgType = self::GetImageType($filename);
		$size = self::GetImageSize($filename);
		$width = $size['width'];
		$height = $size['height'];
		$src = self::LoadImage($filename);
    $dst = imagecreatetruecolor($newwidth, $newheight);
		$size = self::GetImageSize($filename);

		imagesavealpha($dst, true);
		$trans_background = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefill($dst, 0, 0, $trans_background);

		imagecopyresampled($dst, $src, 0, 0, 0, 0, $newwidth, $newheight, $width, $height);
		imagedestroy($src);
		self::SaveImage($filename, $dst, $imgType);
		imagedestroy($dst);
	}

	public static function ResizeToMaxWidth($filename, $maxHeight)
	{

	}
}
