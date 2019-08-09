<?php

namespace helena\entities\frontend\metric;

use minga\framework\Str;
use helena\entities\BaseMapModel;

class ValueLabelInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Value;
	public $LineColor;
	public $FillColor;
	public $Visible;


	public static function GetMap()
	{
		return array (
			'vvl_id' => 'Id',
			'vvl_caption' => 'Name',
			'vvl_value' => 'Value',
			'vvl_line_color' => 'LineColor',
			'vvl_fill_color' => 'FillColor',
			'vvl_visible' => 'Visible');
	}
	public function FixVisible()
	{
		if ($this->Visible == '1')
			$this->Visible = true;
		else
			$this->Visible = false;
	}
	public function FixColors()
	{
		if ($this->LineColor != null && Str::StartsWith($this->LineColor, "#") == false)
			$this->LineColor = "#" . $this->LineColor;
		if ($this->FillColor != null && Str::StartsWith($this->FillColor, "#") == false)
			$this->FillColor = "#" . $this->FillColor;
	}

}


