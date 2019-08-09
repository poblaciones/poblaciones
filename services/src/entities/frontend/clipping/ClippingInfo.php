<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class ClippingInfo extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;

	public $Summary;
	public $Canvas;
	public $Envelope;

	public $Levels;
	public $SelectedLevelIndex;

	public function GetLevelIndex($id, $default = -1)
	{
		for($n = 0; $n < sizeof($this->Levels); $n++)
			if ($this->Levels[$n]->Id == $id)
				return $n;

		return $default;
	}

	public function GetLevelIndexByName($name, $default = -1)
	{
		for($n = 0; $n < sizeof($this->Levels); $n++)
			if ($this->Levels[$n]->Revision == $name)
				return $n;

		return $default;
	}
}
