<?php
namespace helena\classes\spss;
use minga\framework\PublicException;

// The measurement type of the variable
class Measurement
{
	// Nominal scale
	const Nominal = 1;
	// Ordinal scale
	const Ordinal = 2;
	// Continuous scale
	const Scale = 3;

	public static function GetName($value)
	{
		switch($value)
		{
			case self::Nominal:
				return 'nominal';
			case self::Ordinal:
				return 'ordinal';
			case self::Scale:
				return 'ratio';
			default:
				throw new PublicException('Tipo de medida no soportado');
		}
	}

	public static function GetCode($value)
	{
		switch($value)
		{
			case 'nominal':
				return self::Nominal;
			case 'ordinal':
				return self::Ordinal;
			case 'unknown':
			case 'scale':
			case 'ratio':
				return self::Scale;
			default:
				throw new PublicException('Tipo de medida no soportado');
		}
	}

}
