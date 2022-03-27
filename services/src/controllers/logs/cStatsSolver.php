<?php

namespace helena\controllers\logs;

use minga\framework\IO;
use minga\framework\Params;
use minga\framework\Date;

class cStatsSolver
{

	public static function AddMonthlyInfoFiled(&$vals, $path, $addAllItem = true, $addYesterday = false)
	{
		self::CalculateMinDateFiled($path, $minYear, $minMonth);
		return self::doAddMonthlyInfo($vals, $minYear, $minMonth, $addAllItem, $addYesterday);
	}

	public static function AddMonthlyInfo(&$vals, $path, $addAllItem = true, $addYesterday = false, $addHistory = false)
	{
		self::CalculateMinDate($path, $minYear, $minMonth);
		return self::doAddMonthlyInfo($vals, $minYear, $minMonth, $addAllItem, $addYesterday, $addHistory);
	}

	private static function doAddMonthlyInfo(&$vals, $minYear, $minMonth, $addAllItem = true, $addYesterday = false, $addHistory = false)
	{
		$months= array();
		if ($addAllItem)
			$months[] = 'Hoy';
		if ($addYesterday)
			$months[] = 'Ayer';
		if ($addHistory)
			$months[] = 'Histórico';
		if ($minYear < 2200)
		{
			$now = mktime(0, 0, 0, intval(date('m')), 1, intval(date('Y')));
			$target = mktime(0, 0, 0, $minMonth, 1, $minYear);
			while($target <= $now)
			{
				$months[] = date("Y-m", $now);
				$now = strtotime("-1 month" , $now);
			}
		}
		$vals['months'] = $months;
		$default = '';
		if (!$addAllItem && sizeof($months) > 0) $default = $months[0];
		$selMonth = Params::Get('month');
		if (($selMonth == 'Todos' || !in_array($selMonth, $months))
			&& ($addYesterday == false || $selMonth != 'Ayer'))
		{
			$vals['current_month'] = $default;
		}
		else if ($_POST['month'] == 'Ayer')
		{
			$vals['current_month'] = 'yesterday';
		}
		else if ($_POST['month'] == 'Histórico')
		{
			$vals['current_month'] = 'history';
		}
		else
			$vals['current_month'] = str_replace('/', '', $_POST['month']);

		return $vals['current_month'];
	}

	static function CalculateMinDate($path, &$minYear, &$minMonth)
	{
		$minDate = 2200000;
		foreach(IO::GetDirectories($path) as $month)
		{
			$iMonth = intval(str_replace("-", "0", $month));
			if ($iMonth < $minDate && $iMonth != 0)
			{
				$minDate = $iMonth;
			}
		}
		$minYear = intval(substr($minDate . '', 0, 4));
		$minMonth = intval(substr($minDate . '', 5, 2));
	}

	static function CalculateMinDateFiled($path, &$minYear, &$minMonth)
	{
		$minDate = 2200000;
		foreach(IO::GetFiles($path) as $month)
		{
			$iMonth = intval(str_replace("-", "0", $month));
			if ($iMonth < $minDate && $iMonth != 0)
			{
				$minDate = $iMonth;
			}
		}
		$minYear = intval(substr($minDate . '', 0, 4));
		$minMonth = intval(substr($minDate . '', 5, 2));
	}

	public static function AddDaylyInfo(&$vals)
	{
		$months= array();

		$months[] = 'Hoy';
		$months[] = 'Ayer';

		$vals['months'] = $months;

		if (array_key_exists('month', $_POST))
			$default =  $_POST['month'];
		else
			$default = $months[0];

		$vals['current_month'] =$default;

		return $vals['current_month'];
	}

}

