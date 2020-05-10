<?php

namespace helena\classes;

use minga\framework\Str;
use helena\db\frontend\EnvironmentModel;

class Router
{
	public static function ProcessPath(&$route)
	{
		$specials = array('services', 'json', 'admin', 'geoarchivo', 'descargar');
		$parts = Str::ExplodeNoEmpty('/', $route);
		if(count($parts) == 0 || in_array($parts[0], $specials))
			return false;
		if ($parts[0] == 'map')
		{
			array_shift($parts);
		}
		// puede venir la obra.
		if (count($parts) > 0 && self::isWork($parts[0]))
		{
			$route = Str::ReplaceOnce($route, '/'.$parts[0], '');
			array_shift($parts);
		}
		return true;
	}

	private static function isWork($text)
	{
		// solo valida que sea una forma numérica
		return is_numeric($text);
	}
}
