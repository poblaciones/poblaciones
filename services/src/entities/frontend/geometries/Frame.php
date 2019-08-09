<?php

namespace helena\entities\frontend\geometries;

use minga\framework\Params;

class Frame
{
	public $Envelope;
	public $Zoom;
	public $ClippingRegionId;
	public $ClippingCircle;
	// https://stackoverflow.com/questions/11130323/google-map-api-v3-shade-everything-except-for-polygon
	public $ClippingFeatureId;

	public static function FromParams()
	{
		$ret = new Frame();
		$ret->Zoom = Params::GetInt('z', null);
		$ret->Envelope =  Envelope::TextDeserialize(Params::Get('e'));
		$ret->ClippingRegionId = Params::GetInt('r');
		$ret->ClippingCircle = Circle::TextDeserialize(Params::Get('c'));
		$ret->ClippingFeatureId = Params::GetInt('f');

		return $ret;
	}

	public function GetKeyNoFeature()
	{
		return ($this->ClippingRegionId != null ? $this->ClippingRegionId : "0") . "@" .
			($this->ClippingCircle != null ? $this->ClippingCircle->TextSerialize() : "");
	}

	public function GetKey()
	{
		if ($this->ClippingFeatureId != null)
			return $this->ClippingFeatureId;
		else
			return ($this->ClippingRegionId != null ? $this->ClippingRegionId : "0") . "@" .
			($this->ClippingCircle != null ? $this->ClippingCircle->TextSerialize() : "");
	}

	public function GetClippingKey()
	{
		return ($this->ClippingRegionId != null ? $this->ClippingRegionId : "0") . "@" .
			($this->ClippingCircle != null ? $this->ClippingCircle->TextSerialize() : "") . "@" .
			($this->ClippingFeatureId != null ? $this->ClippingFeatureId : "");
	}
	public function GetSummaryKey()
	{
		if ($this->ClippingFeatureId != null)
			return $this->ClippingFeatureId;
		else if ($this->ClippingRegionId != null || $this->ClippingCircle != null)
			return ($this->ClippingRegionId != null ? $this->ClippingRegionId : "0") . "@" .
			($this->ClippingCircle != null ? $this->ClippingCircle->TextSerialize() : "");
		else
			return "0@@" . $this->Envelope->TextSerialize();
	}

	public function HasClippingFactor()
	{
		return ($this->ClippingRegionId != null || $this->ClippingCircle != null || $this->ClippingFeatureId != null);
	}

}
