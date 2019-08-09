<?php

namespace helena\entities\frontend\geometries;

class Circle
{
	public $Center;
	public $Radius;
	// Dibujar circulo
	// http://www.geocodezip.com/blitz-gmap-editor/test5.html
	// Dejar el overlay
	// https://stackoverflow.com/questions/11130323/google-map-api-v3-shade-everything-except-for-polygon

	public function __construct()
	{
		$this->Radius = new \stdClass();
	}

	public function GetEnvelope()
	{
		$min = new Coordinate($this->Center->Lat - $this->Radius->Lat,
			$this->Center->Lon - $this->Radius->Lon);
		$max = new Coordinate($this->Center->Lat + $this->Radius->Lat,
			$this->Center->Lon + $this->Radius->Lon);
		return new Envelope($min, $max);
	}

	public function TextSerialize()
	{
		return $this->Center->TextSerialize() . ";" . $this->Radius->Lat . "," . $this->Radius->Lon;
	}
	public function RadiusToMysqlPoint()
	{
		return "POINT(" . $this->Radius->Lon . "," . $this->Radius->Lat . ")";
	}

	public static function TextDeserialize($text)
	{
		if ($text == null) return null;

		$parts = explode(';', $text);

		if(count($parts) != 2) return null;

		$ret = new Circle();
		$ret->Center = Coordinate::TextDeserialize($parts[0]);
		$radiusParts = explode(',', $parts[1]);
		$ret->Radius->Lat = doubleval($radiusParts[0]);
		$ret->Radius->Lon = doubleval($radiusParts[1]);
		return $ret;
	}

}


