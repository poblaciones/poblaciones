<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class RankingInfo extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;
	public $Items = array();
}


