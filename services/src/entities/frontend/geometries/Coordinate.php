<?php

namespace helena\entities\frontend\geometries;

use helena\classes\GeoJson;

class Coordinate
{
	public $Lat;
	public $Lon;

	public function __construct($lat = null, $long = null)
	{
		$this->Lat = $lat;
		$this->Lon = $long;
	}
	public function Trim()
	{
		return new Coordinate(GeoJson::TrimNumber($this->Lat), GeoJson::TrimNumber($this->Lon));
	}
	public function TextSerialize()
	{
		return $this->Lat . "," . $this->Lon;
	}
	public function ToMysqlPoint()
	{
		return "POINT(" . $this->Lon . "," . $this->Lat . ")";
	}
	public static function TextDeserialize($text)
	{
		if ($text == null) return null;

		$parts = explode(',', $text);
		if (count($parts) != 2)
			return null;

		$ret = new Coordinate();
		$ret->Lat = doubleval($parts[0]);
		$ret->Lon = doubleval($parts[1]);
		return $ret;
	}

	public function ToParams(&$params)
	{
		$params[] = $this->Lon;
		$params[] = $this->Lat;
	}
	public static function FromXYZ($x, $y, $z)
	{
		$n = pow(2, $z);
		$lon_deg = $x / $n * 360.0 - 180.0;
		$lat_deg = rad2deg(atan(sinh(pi() * (1 - 2 * $y / $n))));

		return new Coordinate($lat_deg, $lon_deg);
	}

	public static function FromDb($field)
	{
		$parts = unpack('Lpadding/corder/Lgtype/dlatitude/dlongitude', $field);
		$ret = new Coordinate();
		$ret->Lat = doubleval($parts['latitude']);
		$ret->Lon = doubleval($parts['longitude']);
		return $ret;
	}

	public static function FromDbLonLat($field)
	{
		$parts = unpack('Lpadding/corder/Lgtype/dlatitude/dlongitude', $field);
		$ret = new Coordinate();
		$ret->Lat = doubleval($parts['longitude']);
		$ret->Lon = doubleval($parts['latitude']);
		return $ret;
	}


}


