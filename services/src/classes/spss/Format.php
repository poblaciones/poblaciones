<?php
namespace helena\classes\spss;

use helena\classes\spss\Format;
use minga\framework\ErrorException;

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
				throw new ErrorException('Unknown format: ' . $value);
		}
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
				throw new ErrorException('Format not supported: ' . $value);
		}
	}
}
