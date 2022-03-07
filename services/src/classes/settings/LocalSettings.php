<?php

namespace helena\classes\settings;

use minga\framework\Str;
use minga\framework\settings\Settings;

class LocalSettings extends Settings
{
	private static $map = NULL;
	private static $shard = NULL;
	private static $limits = NULL;

	public function Map()
	{
		if (self::$map == NULL)
			self::$map = new MapSettings();

		return self::$map;
	}

	public function Shard()
	{
		if (self::$shard == NULL)
			self::$shard = new ShardSettings();

		return self::$shard;
	}


	public function MapLimits(): LocalMonitorLimits
	{
		if (self::$limits == NULL)
			self::$limits = new LocalMonitorLimits();

		return self::$limits;
	}

}
