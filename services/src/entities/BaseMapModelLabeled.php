<?php

namespace helena\entities;
use minga\framework\ErrorException;

class BaseMapModelLabeled extends BaseMapModel
{
	public static function GetMap()
	{
		$ret = array();
		foreach(static::GetMapLabeled() as $ele)
		{
			if ($ele[0] != '')
				$ret[$ele[0]] = $ele[1];
		}
		return $ret;
	}
	public static function GetMapLabeled()
	{
		throw new ErrorException("Must implement in child.");
	}
}

