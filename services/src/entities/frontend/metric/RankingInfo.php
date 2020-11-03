<?php

namespace helena\entities\frontend\metric;

use helena\entities\BaseMapModel;

class RankingInfo extends BaseMapModel
{
	public $EllapsedMs;
	public $Cached = 0;
	public $Items = array();
}


