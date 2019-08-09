<?php

namespace helena\classes\spss;
use minga\framework\ErrorException;

// The alignment of the variable for display purposes
class Alignment
{
	// Left aligned
	const Left = 0;

	// Right aligned
	const Right = 1;

	// Center aligned
	const Center = 2;

	public static function GetName($value)
	{
		switch($value)
		{
			case self::Left:
				return 'left';
			case self::Right:
				return 'right';
			case self::Center:
				return 'center';
			default:
				throw new ErrorException('Unknown alignment code: ' . $value);
		}
	}

	public static function GetCode($value)
	{
		switch($value)
		{
			case 'left':
				return self::Left;
			case 'right':
				return self::Right;
			case 'center':
				return self::Center;
			default:
				throw new ErrorException('Unknown measurement: ' . $value);
		}
	}
}
