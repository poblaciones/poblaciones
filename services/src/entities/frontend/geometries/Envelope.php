<?php

namespace helena\entities\frontend\geometries;

use helena\entities\BaseMapModel;
use minga\framework\Str;
use helena\services\frontend\TileDataService;

class Envelope extends BaseMapModel
{
	public $Min;
	public $Max;

	public function __construct($min, $max)
	{
		$this->Min = $min;
		$this->Max = $max;
	}
	public function TextSerialize()
	{
		return $this->Min->TextSerialize() . ";" . $this->Max->TextSerialize() ;
	}
	public function Trim()
	{
		return new Envelope($this->Min->Trim(), $this->Max->Trim());
	}

	public static function TextDeserialize($text)
	{
		if ($text == null) return null;

		$parts = explode(';', $text);
		$ret = new Envelope(Coordinate::TextDeserialize($parts[0]),
			Coordinate::TextDeserialize($parts[1]));
		return $ret;
	}

	public static function FromDb($field)
	{
		$coords = Str::PolygonToCoordinates($field);

		$min = new Coordinate();
		$min->Lat = doubleval($coords[0][1]);
		$min->Lon = doubleval($coords[0][0]);

		$max = new Coordinate();
		$max->Lat = doubleval($coords[2][1]);
		$max->Lon = doubleval($coords[2][0]);

		$ret = new Envelope($min, $max);
		return $ret;
	}
	public static function FromCircle($circle)
	{
		$min = new Coordinate();
		$min->Lat = doubleval($circle->Center->Lat - $circle->Radius->Lat);
		$min->Lon = doubleval($circle->Center->Lon - $circle->Radius->Lon);

		$max = new Coordinate();
		$max->Lat = doubleval($circle->Center->Lat + $circle->Radius->Lat);
		$max->Lon = doubleval($circle->Center->Lon + $circle->Radius->Lon);

		$ret = new Envelope($min, $max);
		return $ret;
	}


	public function GetCentroid()
	{
		$ret = new Coordinate();
		$ret->Lat = ($this->Min->Lat + $this->Max->Lat) / 2;
		$ret->Lon = ($this->Min->Lon + $this->Max->Lon) / 2;
		return $ret;
	}
	public function ToFormattedString()
	{
		return "Latitud norte: " . Str::FormatLocaleNumber($this->Min->Lat, 6) . ". "
						. "Longitud oeste: " . Str::FormatLocaleNumber($this->Min->Lon, 6) . ". \n"
						. "Latitud sur: " . Str::FormatLocaleNumber($this->Max->Lat, 6) . ". "
						. "Longitud este: " . Str::FormatLocaleNumber($this->Max->Lon, 6) . ". ";
	}
	public function ToWKT()
	{
		return "POLYGON((" . $this->Min->Lon .
			" " . $this->Min->Lat .
			", " . $this->Max->Lon .
			" " . $this->Min->Lat .
			", " . $this->Max->Lon .
			" " . $this->Max->Lat .
			", " . $this->Min->Lon .
			" " . $this->Max->Lat .
			", " . $this->Min->Lon .
			" " . $this->Min->Lat . "))";
	}
	public static function FromXYZ($x, $y, $z)
	{
		$min = Coordinate::FromXYZ($x, $y+1, $z);
		$max = Coordinate::FromXYZ($x+1, $y, $z);
		$ret = new Envelope($min, $max);
		return $ret;
	}

	public function Contains($lat, $lon)
	{
		return ($lat >= $this->Min->Lat && $lat < $this->Max->Lat &&
						$lon >= $this->Min->Lon && $lon < $this->Max->Lon);
	}

	public function Size()
	{
		return new Size($this->Max->Lon - $this->Min->Lon, $this->Max->Lat - $this->Min->Lat);
	}

	public function ToParams(&$params)
	{
		$params[] = $this->Min->Lon;
		$params[] = $this->Min->Lat;

		$params[] = $this->Max->Lon;
		$params[] = $this->Min->Lat;

		$params[] = $this->Max->Lon;
		$params[] = $this->Max->Lat;

		$params[] = $this->Min->Lon;
		$params[] = $this->Max->Lat;
	}
}


