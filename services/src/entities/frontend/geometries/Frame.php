<?php

namespace helena\entities\frontend\geometries;

use minga\framework\Params;

class Frame
{
	public $Envelope;
	public $Zoom;
	public $Center;
	public $ClippingRegionIds;
	public $ClippingCircle;
	public $TileEnvelope = null;
	public $TileEnvelopeKey = null;

	public static function FromTileParams()
	{
		$ret = self::FromParams();
		$x = Params::GetIntMandatory('x');
		$y = Params::GetIntMandatory('y');
		$z = Params::GetIntRangeMandatory('z', 0, 23);
		$ret->TileEnvelope = Envelope::FromXYZ($x, $y, $z);
		$ret->TileEnvelopeKey = "@x" . $x . "y" . $y . "z" . $z;
		return $ret;
	}

	public static function FromParams()
	{
		$ret = new Frame();
		$ret->Zoom = Params::GetInt('z', null);
		$ret->Envelope =  Envelope::TextDeserialize(Params::Get('e'));
		$ret->ClippingRegionIds = Params::GetIntArray('r');
		$ret->ClippingCircle = Circle::TextDeserialize(Params::Get('c'));

		return $ret;
	}

	public function GetKeyNoFeature()
	{
		return $this->ClippingRegionPart() . "@" .
			($this->ClippingCircle != null ? $this->ClippingCircle->TextSerialize() : "");
	}

	public function GetKey()
	{
		return $this->ClippingRegionPart() . "@" .
			($this->ClippingCircle != null ? $this->ClippingCircle->TextSerialize() : "");
	}
	public function GetTileKey()
	{
		return $this->TileEnvelopeKey;
	}
	private function ClippingRegionPart()
	{
		if (!$this->ClippingRegionIds || sizeof($this->ClippingRegionIds) === 0)
			return "0";
		else
			return implode(",", $this->ClippingRegionIds);
	}
	public function GetClippingKey()
	{
		return $this->ClippingRegionPart() . "@" .
			($this->ClippingCircle != null ? $this->ClippingCircle->TextSerialize() : "");
	}
	public function GetSummaryKey()
	{
		if ($this->ClippingRegionIds != null || $this->ClippingCircle != null)
			return $this->ClippingRegionPart() . "@" .
			($this->ClippingCircle != null ? $this->ClippingCircle->TextSerialize() : "");
		else
			return "0@@" . $this->Envelope->TextSerialize();
	}

	public function HasClippingFactor()
	{
		return ($this->ClippingRegionIds != null || $this->ClippingCircle != null);
	}

}
