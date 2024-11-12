<?php
namespace helena\classes\spss;

use minga\framework\PublicException;

// The print/write format for the data.
// For more info on this see http://www.ibm.com/support/knowledgecenter/SSLVMB_20.0.0/com.ibm.spss.statistics.help/syn_variables_variable_formats.htm
class Format
{
	const NotUsed1 = 0;
	const A = 1; //Alfabético
	const AHEX = 2;
	const COMMA = 3;
	const DOLLAR = 4;
	const F = 5; //Numérico
	const IB = 6;
	const PIBHEX = 7;
	const P = 8;
	const PIB = 9;
	const PK = 10;
	const RB = 11;
	const RBHEX = 12;

	const NotUsed2 = 13;
	const Point = 13;

	const NotUsed3 = 14;
	const Geometry = 14;

	const Z = 15;
	const N = 16;
	const E = 17;
	const NotUsed4 = 18;
	const NotUsed5 = 19;
	const DATE = 20;
	const TIME = 21;
	const DATETIME = 22;
	const ADATE = 23;
	const JDATE = 24;
	const DTIME = 25;
	const WKDAY = 26;
	const MONTH = 27;
	const MOYR = 28;
	const QYR = 29;
	const WKYR = 30;
	const PCT = 31;
	const DOT = 32;
	const CCA = 33;
	const CCB = 34;
	const CCC = 35;
	const CCD = 36;
	const CCE = 37;
	const EDATE = 38;
	const SDATE = 39;

	public static function GetName($value)
	{
		switch($value)
		{
			case self::A:
				return 'A';
			case self::F:
				return 'F';
			default:
				throw new PublicException('Format de columna no soportado');
		}
	}
	public static function ThrowUnsupportedFormat($format)
	{
		switch($format)
		{
			case self::N:
				$extra = 'numérico restringido';
				break;
			case self::PCT:
				$extra = 'porcentaje';
				break;
			case self::COMMA:
				$extra = 'coma';
				break;
			case self::DOT:
			case self::Point:
				$extra = 'punto';
				break;
			case self::DOLLAR:
				$extra = 'dólar';
				break;
			case self::DATE:
			case self::TIME:
			case self::DATETIME:
			case self::ADATE:
			case self::JDATE:
			case self::DTIME:
			case self::WKDAY:
			case self::MONTH:
			case self::MOYR:
			case self::QYR:
			case self::WKYR:
				$extra = 'fecha/hora';
				break;
			case self::E:
				$extra = 'notación científica';
				break;
			default:
				$extra = '';
		}
		if ($extra != '') $extra = ': ' . $extra;

		throw new PublicException('Format de columna no soportado' . $extra);
	}

	public static function GetCode($value)
	{
		switch($value)
		{
			case 'A':
				return self::A;
			case 'F':
				return self::F;
			default:
				self::ThrowUnsupportedFormat($value);
				return null;
		}
	}
}
