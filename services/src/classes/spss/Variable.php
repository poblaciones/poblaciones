<?php

namespace helena\classes\spss;
use minga\framework\Str;

class Variable
{
	public static function FixName($name)
	{
		$name = self::FixContent($name);
		$name = self::FixRules($name);
		$name = self::FixEnding($name);
		$name = self::FixLength($name);
		return $name;
	}

	private static function FixEnding($name)
	{
		while(Str::EndsWith($name, ".") || Str::EndsWith($name, "_"))
		{
			$name = substr($name, 0, strlen($name) - 1);
		}
		return $name;
	}

	private static function FixRules($name)
	{
		// inicios
		$forbiddenStarts = array(".", "_", "#", "$");
		if (in_array($name[0], $forbiddenStarts))
			$name = "@" . $name;
		// keywords
		$keywords = array("ALL", "AND", "BY", "EQ", "GE", "GT", "LE", "LT", "NE", "NOT", "OR", "TO", "WITH");
		if (in_array(Str::ToUpper($name), $keywords))
			$name = "@" . $name;
		// listo
		return $name;
	}
	private static function FixContent($name)
	{
		$validChars = 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑŎÒÓÔÕÖØÙÚÛÜÝßàáâãäåæçèéêëìíîïðñòóôõöŏōøùúûüýÿABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_$@#.';
		for($i = 0; $i < strlen($name); $i++)
		{
			if(Str::Contains($validChars, $name[$i]) == false)
				$name[$i] = '_';
		}
		$name = iconv("UTF-8","UTF-8//IGNORE", $name);
		return $name;
	}

	private static function FixLength($name)
	{
		// cuenta la longitud de la cadena. Caracters no estándar cuentan como 2.
		$SPSS_LIMIT = 64;
		$effectiveLength = 0;
		for($n = 0; $n < strlen($name); $n++)
		{
			if (($name[$n] >= 'a' && $name[$n] <= 'z') || ($name[$n] >= 'A' && $name[$n] <= 'Z') ||
				($name[$n] >= '0' && $name[$n] <= '9') || $name[$n] === '.' || $name[$n] === '_' || $name[$n] === '$' || $name[$n] === '@' || $name[$n] === '#')
			{
				$effectiveLength++;
			} else {
				$effectiveLength += 2;
			}
		}
		if ($effectiveLength > $SPSS_LIMIT) {
			$name = substr($name, 0, strlen($name) - ($effectiveLength - $SPSS_LIMIT));
		}
		return $name;
	}
}
