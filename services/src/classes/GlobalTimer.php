<?php

namespace helena\classes;

class GlobalTimer
{
	private static $startTime;
	private static $values = array();
	private static $steps = array();
	private static $currentCaption = array();
	private static $currentStartTime = array();

	public static function Start()
	{
		self::$startTime = microtime(true);
	}

	public static function EllapsedMs()
	{
		$endtime = microtime(true);
		return (int) (($endtime - self::$startTime) * 1000);
	}
	public static function AddTrace($caption)
	{
		self::$steps[] = $caption . ' ' . self::EllapsedMs() . 'ms.';
	}
	public static function Begin($caption)
	{
		self::$currentStartTime[] = microtime(true);
		self::$currentCaption[] = $caption;
	}
	public static function GetValues()
	{
		return self::$values;
	}

	public static function GetSteps()
	{
		return self::$steps;
	}
	public static function End()
	{
		$start = array_pop(self::$currentStartTime);
		$caption = array_pop(self::$currentCaption);
		$depth = sizeof(self::$currentStartTime);
		if ($depth === 0)
			$sp = '';
		else
			$sp = str_repeat('=', $depth) . '> ';
		$endtime = microtime(true);
		$ms = (int) (($endtime - $start) * 1000);
		self::$values[] = array('Action' => $sp . $caption, 'Ellapsed' => $ms . 'ms');
	}
}

