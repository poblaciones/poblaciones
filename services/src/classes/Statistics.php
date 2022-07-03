<?php

namespace helena\classes;

use minga\framework\IO;
use minga\framework\Context;
use minga\framework\GeoIp;
use minga\framework\Params;
use minga\framework\Date;
use minga\framework\Profiling;
use helena\caches\WorkPermissionsCache;
use helena\services\backoffice\publish\PublishDataTables;

class Statistics
{
	private static $cache = [];

	public static function StoreDownloadDatasetHit($workId, $datasetId, $downloadType)
	{
		Profiling::BeginTimer();
		self::SaveData($workId, 'download', $datasetId, $downloadType);
		Profiling::EndTimer();
	}

	public static function StoreLanding($workId)
	{
		// Poblaciones.org / google.com / facebook.com / ??
		Profiling::BeginTimer();
		self::StoreInternalHit($workId, 'referer', true);
		Profiling::EndTimer();
	}

	private static function ShouldSaveStats($workId)
	{
		if (!Session::IsSiteReader())
			return true;
		else
		{
			$workIdUnShardified = PublishDataTables::Unshardify($workId);
			$permission = WorkPermissionsCache::GetCurrentUserPermission($workIdUnShardified);
			return ($permission === WorkPermissionsCache::ADMIN ||
				$permission === WorkPermissionsCache::EDIT ||
				$permission === WorkPermissionsCache::VIEW);
		}
	}

	public static function ResolveWorkMonths($workId)
	{
		$months = [];
		$minYear = '';
		$minMonth = '';
		self::CalculateWorkMinDate($workId, $minYear, $minMonth);
		if ($minYear < 2200)
		{
			$now = new \DateTime(date('Y') . "-" . date('m') . "-1");
			$target = new \DateTime($minYear . "-" . $minMonth . "-1");
			while($target <= $now)
			{
				$months[] = $now->format("Y-m");
				$now->sub(new \DateInterval('P1M'));
			}
		}
		return $months;
	}

	public static function ResolveWorkQuarters($workId)
	{
		$quarters = [];
		$minYear = '';
		$minMonth = '';
		self::CalculateWorkMinDate($workId, $minYear, $minMonth);
		if ($minYear < 2200)
		{
			$now = new \DateTime(date('Y') . "-" . date('m') . "-1");
			$target = new \DateTime($minYear . "-" . $minMonth . "-1");
			while($target <= $now)
			{
				$q = (int) ((Date::DateTimeGetMonth($now) + 2) / 3);
				$qFormatted = $now->format("Y") . "-T" . $q;
				if (!in_array($qFormatted, $quarters))
					$quarters[] = $qFormatted;
				$now->sub(new \DateInterval('P1M'));
			}
		}
		return $quarters;
	}

	public static function CalculateWorkMinDate($workId, &$minYear, &$minMonth)
	{
		$minDate = 2200000;
		$path = Paths::GetStatisticsPath();

		foreach(IO::GetDirectories($path) as $month)
		{
			$folder = Paths::GetStatisticsPath() . "/" . $month;
			$workIdShardified = PublishDataTables::Shardified($workId);
			$file = self::GetFilename($folder, $workIdShardified);
			if (file_exists($file))
			{
				$iMonth = intval(str_replace("-", "0", $month));
				if ($iMonth < $minDate && $iMonth != 0)
				{
					$minDate = $iMonth;
				}
			}
		}
		$minYear = intval(substr($minDate . '', 0, 4));
		$minMonth = intval(substr($minDate . '', 5, 2));
	}

	public static function SaveEmbeddedHit($topUrl, $clientUrl)
	{
		// Guarda el hit
		$sql = "INSERT INTO statistic_embedding (emb_month, emb_host_url, emb_map_url, emb_hits)
				VALUES(?, ?, ?, 1) ON DUPLICATE KEY UPDATE emb_hits = emb_hits + 1";
		$month = Date::GetLogMonthFolder();
		App::Db()->exec($sql, [$month, $topUrl, $clientUrl]);
	}

	public static function StoreInternalHit($workId, $subtype, $saveReferer = false)
	{
		// $subtype: google | backoffice
		Profiling::BeginTimer();

		if (self::ShouldSaveStats($workId))
			self::SaveData($workId, 'internal', $subtype, null, $saveReferer);
		Profiling::EndTimer();
	}

	public static function StoreDownloadMetadataHit($workId)
	{
		Profiling::BeginTimer();
		self::SaveData($workId, 'metadata', '');
		Profiling::EndTimer();
	}

	public static function StoreDownloadMetadataAttachmentHit($workId, $id)
	{
		Profiling::BeginTimer();
		self::SaveData($workId, 'attachment', $id);
		Profiling::EndTimer();
	}

	public static function StoreSelectedMetricHit($selectedMetric)
	{
		Profiling::BeginTimer();

		$metricId = $selectedMetric->Metric->Id;
		$size = sizeof($selectedMetric->Versions);
		for($n = 0; $n < $size; $n++)
		{
			$version = $selectedMetric->Versions[$n];
			$work = $version->Work;
			$workId = $work->Id;
			$isLast = ($n === $size - 1 ? 1 : 0);
			self::SaveData($workId, 'metric', $metricId, $isLast);
		}

		Profiling::EndTimer();
	}
	public static function ReadAndSummarizeWorkLastPeriods($workId, $month = null)
	{
		$monthsToScan = null;
		$periods = null;
		$periodCaptions = null;
		if (!$month)
		{
			$fechaActual = Date::DateTimeArNow();
			$fechaPasada = clone $fechaActual;
			$fechaPasada->add(new \DateInterval('P1D'));
			$fecha7Dias = clone $fechaActual;
			$fecha7Dias->sub(new \DateInterval('P6D'));
			$fecha30Dias = clone $fechaActual;
			$fecha30Dias->sub(new \DateInterval('P29D'));
			$fecha90Dias = clone $fechaActual;
			$fecha90Dias->sub(new \DateInterval('P89D'));

			$monthsToScan = self::ResolveMonthsRangeFromNow($fecha90Dias);
			$periods = [[$fecha90Dias, $fechaPasada], [$fecha30Dias, $fechaPasada], [$fecha7Dias, $fechaPasada]];
			$periodCaptions = ['90 días', '30 días', '7 días'];
		}
		else if (substr($month, 5, 1) == 'T')
		{
			$quarter = intval(substr($month, 6, 1));
			$monthStart = $quarter * 3 - 2;
			$year = intval(substr($month, 0, 4));

			$fechaInicio = new \DateTime($year . '-' . $monthStart  . '-01');
			$mes1 = $fechaInicio;
			$mes2 = clone $fechaInicio;
			$mes2->add(new \DateInterval('P1M'));
			$mes3 = clone $fechaInicio;
			$mes3->add(new \DateInterval('P2M'));

			$fechaPasada = clone $fechaInicio;
			$fechaPasada->add(new \DateInterval('P3M'));

			$periods = [[$mes1, $mes2], [$mes2, $mes3], [$mes3, $fechaPasada]];
			$monthsToScan = self::ResolveMonthsRange($mes1, $fechaPasada);
			$periodCaptions = $monthsToScan;
		}
		else
		{
			$monthsToScan = [$month];
			$periodCaptions = [$month];
		}
		$data = [];

		foreach($monthsToScan as $month)
		{
			self::ReadAndSummarizeWorkMonth($workId, $month, $data, $periods);
		}
		$data['periods'] = $periodCaptions;
		return $data;
	}

	private static function ResolveMonthsRange($fechaInicial, $fechaFinal)
	{
		$monthsToScan = [];
		$fechaActual = clone $fechaInicial;
		while($fechaActual < $fechaFinal)
		{
			$monthsToScan[] = Date::GetLogMonthFolderYearMonth(Date::DateTimeGetYear($fechaActual), Date::DateTimeGetMonth($fechaActual));
			$fechaActual->add(new \DateInterval('P1M'));
		}
		return $monthsToScan;
	}

	private static function ResolveMonthsRangeFromNow($fechaInicial)
	{
		$fechaActual = Date::DateTimeArNow();
		$monthsSpan = Date::AbsoluteMonth($fechaActual) - Date::AbsoluteMonth($fechaInicial);
		$monthsToScan = [];
		for($offset = 0; $offset <= $monthsSpan; $offset++)
			$monthsToScan[] = Date::GetLogMonthFolder(-$offset);
		return $monthsToScan;
	}

	public static function ReadAndSummarizeWorkMonth($workId, $logMonth, &$data, $cuts = null, $processRegion = true, $addOnlyLastMetric = false) : void
	{
		Profiling::BeginTimer();
		if (sizeof($data) === 0) $data = self::InitialArray();

		// Procesa los cortes
		if ($cuts)
		{
			$cutsText = [];
			foreach($cuts as $cut)
				$cutsText[] = [$cut[0]->format('Y-m-d'), $cut[1]->format('Y-m-d')];
		}
		else
		{
			$cutsText = [['', '9999']];
		}
		$folder = Paths::GetStatisticsPath() . "/" . $logMonth;
		if (!is_dir($folder)) return;

		$file = self::GetFilename($folder, $workId);
		if (!file_exists($file))
			return;

		$lines = IO::ReadAllLines($file);

		for($n = sizeof($lines) - 1; $n >= 0; $n--)
		{
			if ($lines[$n] != '')
			{
				$lineParts = self::DecodeArray($lines[$n]);
				$time = $lineParts['time'];
				$type = $lineParts['t'];
				$extra = $lineParts['e'];
				$id = $lineParts['id'];
				$region = null;

				if ($type == 'metadata')
				{
					$type = 'attachment';
					$id = 'metadata';
				}
				$generalItem = ($type == 'download' || $type == 'attachment' ? 'Descargas' : 'Consultas');

				// Agrega valores para cada corte
				$sample = [];
				for($d = 0; $d < sizeof($cutsText); $d++)
					$sample['d' . $d] = 0;

				for($d = 0; $d < sizeof($cutsText); $d++)
				{
					if (!self::TimeExceeded($cutsText[$d], $time))
					{
						if ($region = null)
						{
							if ($processRegion)
								$region = self::decodeRegion($lineParts['ip']);
							else
								$region = '';
						}
						if ($type !== 'metric' || !$addOnlyLastMetric || $extra === '' || $extra === '1')
								self::AddHit($data, 'd' . $d, $sample, $type, $id);

						if ($type == 'download')
							self::AddHit($data, 'd' . $d, $sample, 'downloadType', $extra);
						else if ($type == 'attachment')
							self::AddHit($data, 'd' . $d, $sample, 'downloadType', 'pdf');

						if ($type !== 'internal')
						{
							self::AddHit($data, 'd' . $d, $sample, 'work', $generalItem);
							if ($processRegion)
								self::AddHit($data, 'd' . $d, $sample, 'region', $region);
						}
					}
				}
			}
		}
		Profiling::EndTimer();

	}

	private static function InitialArray()
	{
		return ['download' => [],  'attachment' => [], 'internal' => [], 'work' => [], 'metric' => [], 'downloadType' => [], 'region' => []];
	}

	public static function decodeRegion($ip)
	{
		if (isset(self::$cache[$ip]))
			return self::$cache[$ip];
	Profiling::BeginTimer();

		$countryObj = GeoIp::GetCountry($ip);
		if (!$countryObj) return 'Otros';
		$country = $countryObj->names['es'];
		if ($country === Context::Settings()->currentCountry)
		{
			$subdivisions = GeoIp::GetSubdivisions($ip);
			if ($subdivisions > 0 && sizeof($subdivisions) > 0)
			{
				$provincia = $subdivisions[0]->names['es'];
				if ($provincia == 'Buenos Aires C.F.')
					$provincia = 'Ciudad Autónoma de Buenos Aires';
				$country .= '|' . $provincia;
			}
			else
			{
				$country .= '|Otros';
			}
		}
		Profiling::EndTimer();

		self::$cache[$ip] = $country;
		return $country;
	}

	private static function TimeExceeded($timeLimitText, $time)
	{
		// recibe un array con desde-hasta
		return $time < $timeLimitText[0] || $time >= $timeLimitText[1];
	}

	private static function AddHit(&$data, $attribute, $emptySample, $type, $id)
	{
		$typeArray = &$data[$type];
		if (!$id) $id = 'null';
		if (array_key_exists($id, $typeArray))
			$idArray = &$typeArray[$id];
		else
		{
			$idArray = $emptySample;
			$typeArray[$id] = &$idArray;
		}
		if (array_key_exists($attribute, $idArray))
			$idArray[$attribute]++;
		else
			$idArray[$attribute] = 1;
	}


	private static function GetFilename($folder, $workId)
	{
		return $folder . "/work" . $workId . ".log";
	}

	private static function SaveData($workId, $type, $id, $extra = '', $saveReferer = false)
	{
		if ($saveReferer)
			$referer = Params::SafeServer('HTTP_REFERER', '');
		else
			$referer = '';
		$remoteAddr = Params::SafeServer('REMOTE_ADDR', '');
		$user = Account::Current()->user;
		$time = Date::FormattedArNow();

		$args = array('time' => $time, 't' => $type, 'id' => $id,
													'e' => $extra, 'user' => $user,
													'ip' => $remoteAddr, 'r' => $referer);
		$line = self::EncodeArray($args);
		$folder = Paths::GetStatisticsPath() . "/" . Date::GetLogMonthFolder();
		IO::EnsureExists($folder);
		$file = self::GetFilename($folder, $workId);
		IO::AppendLine($file, $line);
	}

	private static function DecodeArray($line)
	{
		$parts = explode('&', $line);
		$ret = [];
		foreach($parts as $element)
		{
			$eq = explode('=', $element);
			if (sizeof($eq) == 1)
				$ret[$eq[0]] = null;
			else
				$ret[$eq[0]] = urldecode($eq[1]);
		}
		return $ret;
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