<?php

namespace helena\caches;

use minga\framework\caching\StringCache;

class AddressesCache extends BaseCache
{
	public static function Cache()
  {
		return new StringCache("Lookup/Addresses");
	}
}

