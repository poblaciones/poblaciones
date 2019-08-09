<?php

namespace helena\services\backoffice\cloning;

use minga\framework\Str;

class SqlBuilder
{
	public static function FormatValue($value)
	{
		if ($value === null)
			return "null";
		if (is_array($value))
			return $value[0];
		if (is_string($value))
				return "'" . Str::Replace($value, "'", "''") . "'";
		else
			return $value;
	}
}

