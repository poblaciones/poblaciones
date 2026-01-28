<?php

namespace helena\classes\settings;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Request;
use minga\framework\Context;

class ServiceCacheSettings
{

	public int $TileDataCachePerFileLimitMB = 500;
	public int $TileDataCacheLimitMB = 15000;

}
