<?php

namespace helena\services\wfs;

// Nombres de las propiedades de una capa. DescribeFeatureType y GetFeature deben
// coincidir letra por letra, y deben ser nombres de elemento XML válidos: el ShortName
// de una variable es texto libre (con espacios, acentos, signos).
class WfsFieldNames
{
	const GEOMETRY = 'geometry';
	const ITEM_ID = 'geography_item_id';
	const NAME = 'name';

	// Devuelve [variableId => nombreBase]. De cada nombre base derivan
	// {base}, {base}_total, {base}_lid y {base}_pct.
	public static function ForVariables($variables)
	{
		$used = [self::GEOMETRY => true, self::ITEM_ID => true, self::NAME => true];
		$ret = [];
		foreach ($variables as $variable)
		{
			$variableId = (int) $variable['Id'];
			$base = self::BaseName($variable);
			$candidate = $base;
			$attempt = 0;
			while (self::Collides($candidate, $used))
			{
				$attempt++;
				$candidate = $base . '_' . $variableId;
				if ($attempt > 1)
					$candidate .= '_' . $attempt;
			}
			foreach (self::Derived($candidate) as $name)
				$used[$name] = true;
			$ret[$variableId] = $candidate;
		}
		return $ret;
	}

	private static function BaseName($variable)
	{
		$name = '';
		if (isset($variable['ShortName']))
			$name = WfsTypeName::Sanitize($variable['ShortName']);
		if ($name === '')
			return 'v' . (int) $variable['Id'];
		if (ctype_digit($name[0]))
			return 'v_' . $name;
		return $name;
	}

	private static function Derived($base)
	{
		return [$base, $base . '_total', $base . '_lid', $base . '_pct'];
	}

	private static function Collides($candidate, $used)
	{
		foreach (self::Derived($candidate) as $name)
		{
			if (isset($used[$name]))
				return true;
		}
		return false;
	}
}
