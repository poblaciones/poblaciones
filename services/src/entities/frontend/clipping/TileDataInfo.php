<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class TileDataInfo extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;
	public $Data;
	public $Texture = null;
}


