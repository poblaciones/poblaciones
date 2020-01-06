<?php

namespace helena\classes;

use minga\framework\IO;
use minga\framework\Params;
use minga\framework\Date;
use minga\framework\Profiling;

class Statistics
{
	public static function StoreDownloadDatasetHit($workId, $datasetId, $downloadType)
	{
		Profiling::BeginTimer();
		self::SaveData($workId, 'download', $datasetId, $downloadType);
		Profiling::EndTimer();
	}

	public static function StoreDownloadMetadataHit($workId)
	{
		Profiling::BeginTimer();
		self::SaveData($workId, 'metadata', '');
		Profiling::EndTimer();
	}

	public static function StoreSelectedMetricHit($selectedMetric)
	{
		Profiling::BeginTimer();
		$metricId = $selectedMetric->Metric->Id;
		foreach($selectedMetric->Versions as $version)
		{
			$work = $version->Work;
			$workId = $work->Id;
			self::SaveData($workId, 'metric', $metricId);
		}
		Profiling::EndTimer();
	}

	private static function SaveData($workId, $type, $id, $extra = '')
	{
		$agent = Params::SafeServer('HTTP_USER_AGENT', '');
		$referer = Params::SafeServer('HTTP_REFERER', '');
		$remoteAddr = Params::SafeServer('REMOTE_ADDR', '');
		$user = Account::Current()->user;
		$time = Date::FormattedArDate();

		$line = self::EncodeArray(array('t' => $type, 'id' => $id, 'e' => $extra, 'time' => $time, 'user' => $user, 'ip' => $remoteAddr, 'r' => $referer, 'a' => $agent));
		$folder = Paths::GetStatisticsPath() . "/" . Date::GetLogMonthFolder();
		IO::EnsureExists($folder);
		$file =  $folder . "/work" . $workId . ".log";
		IO::AppendLine($file, $line);
	}
	private static function EncodeArray($arr)
	{
		$ret = '';
		foreach($arr as $key => $value)
		{
			if ($value === null) $value = '';
			$ret .= $key . "=" . urlencode($value) . '&';
		}
		return $ret;
	}
}