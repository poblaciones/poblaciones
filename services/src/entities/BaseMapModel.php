<?php

namespace helena\entities;

use minga\framework\Params;
use minga\framework\ErrorException;

class BaseMapModel
{
	public function Fill($row, $map = null, $preffix = '')
	{
		if ($map == null)
			$map = static::GetMap();
		foreach($map as $key => $value)
		{
			$this->$value = $row[$preffix . $key];
		}
	}

	public function FillFromParams($preffix = '', $map = null)
	{
		if ($map == null)
			$map = static::GetMap();
		foreach($map as $value)
		{
			$paramValue = Params::Get($preffix . $value, null);
			if ($paramValue !== null)
			{
				$this->$value = $paramValue;
			}
		}
	}

	public static function GetMap()
	{
		throw new ErrorException("Must implement in child.");
	}
}

