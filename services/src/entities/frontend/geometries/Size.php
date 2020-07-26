<?php

namespace helena\entities\frontend\geometries;
use helena\classes\GeoJson;

class Size
{
	public $Width;
	public $Height;

	public function __construct($width = null, $height = null)
	{
		$this->Height = $height;
		$this->Width = $width;
	}
	public function Trim()
	{
		return new Coordinate(GeoJson::TrimNumber($this->Height), GeoJson::TrimNumber($this->Width));
	}
	public function TextSerialize()
	{
		return $this->Height . "," . $this->Width;
	}
	public static function TextDeserialize($text)
	{
		if ($text == null || $text == '') return null;

		$parts = explode(',', $text);
		if (count($parts) != 2)
			return null;

		$ret = new Size();
		$ret->Height = doubleval($parts[0]);
		$ret->Width = doubleval($parts[1]);
		return $ret;
	}

	public function ToParams(&$params)
	{
		$params[] = $this->Width;
		$params[] = $this->Height;
	}
}


