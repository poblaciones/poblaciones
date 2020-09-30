<?php

namespace helena\services\admin;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\Date;
use minga\framework\Performance;
use minga\framework\Profiling;
use minga\framework\IO;

use helena\classes\App;
use helena\classes\Paths;
use helena\classes\Statistics;
use helena\services\common\BaseService;

class StatisticsService extends BaseService
{
	public function GetStatistics($month)
	{
		if ($month === null)
		{
			$month = Date::GetLogMonthFolder();
			$possible = $this->GetPossibleMonths();
		}
		else
			$possible = [];

		$sqlWorks = "SELECT sta_element_id Id, met_title Caption, sta_hits Hits, sta_downloads Downloads, sta_google Google, sta_backoffice Backoffice
										 FROM statistic JOIN work ON sta_element_id = wrk_id JOIN metadata ON met_id = wrk_metadata_id
									WHERE sta_month = ? AND sta_type = 'W' ORDER BY sta_hits DESC";
		$works = App::Db()->fetchAll($sqlWorks, array($month));

		$sqlMetrics = "SELECT sta_element_id Id, mtr_caption Caption, sta_hits Hits, sta_downloads Downloads, sta_google Google, sta_backoffice Backoffice
										 FROM statistic JOIN metric ON sta_element_id = mtr_id
									WHERE sta_month = ? AND sta_type = 'M' ORDER BY sta_hits DESC";
		$metrics = App::Db()->fetchAll($sqlMetrics, array($month));
		$summarized = $this->IsSummarized($month);

		// Arma el block de resumen mensual
		$dailyTable = Performance::GetDaylyTable($month);
		$totals = $this->CreateTotalHits($month, $dailyTable, $works, $metrics);
		$resources = $this->CreateTotalsResources($month, $dailyTable);

		return ['Totals' => $totals, 'Resources' => $resources, 'Works' => $works, 'Metrics' => $metrics, 'Months' => $possible, 'IsSummarized' => $summarized];
	}

	private function CreateTotalHits($month, $dailyTable, $works, $metrics)
	{
		$ret = [];

		$sessions = Arr::SummarizeValues($dailyTable['Usuarios únicos']);
		$ret[] = [ 'Caption' => 'Usuarios únicos del mes', 'Hits' => $sessions];

		$metricHits = Arr::SummarizeField($metrics, 'Hits');
		$ret[] = [ 'Caption' => 'Consulta de indicadores', 'Hits' => $metricHits];

		$downloads = Arr::SummarizeField($works, 'Downloads');
		$ret[] = [ 'Caption' => 'Descargas', 'Hits' => $downloads];

		$google = Arr::SummarizeField($works, 'Google');
		$ret[] = [ 'Caption' => 'Ingresos desde Google', 'Hits' => $google];

		$newUsers = $this->GetNewMonthUsers($month);
		$ret[] = [ 'Caption' => 'Nuevos usuarios', 'Hits' => $newUsers ];

		$backoffice = Arr::SummarizeField($works, 'Backoffice');
		$ret[] = [ 'Caption' => 'Ingresos a backoffice', 'Hits' => $backoffice];

		return $ret;
	}

	private function CreateTotalsResources($month, $dailyTable)
	{
		$ret = [];

		$globalHits = Arr::SummarizeValues($dailyTable['Hits']);
		$ret[] = [ 'Caption' => 'Hits totales del mes', 'Hits' => $globalHits ];

		$avgTime = intval(Arr::MeanValues($dailyTable['Promedio (ms.)'], $dailyTable['Hits'])) . ' ms';
		$ret[] = [ 'Caption' => 'Tiempo promedio', 'Hits' => $avgTime ];

		$emails = Arr::SummarizeValues($dailyTable['Mails']);
		$ret[] = [ 'Caption' => 'Correos electrónicos enviados', 'Hits' => $emails ];

		$crawler = Arr::SummarizeValues($dailyTable['GoogleBot']);
		$ret[] = [ 'Caption' => 'Hits de GoogleBot', 'Hits' => $crawler ];

		$mapsKey = Arr::SummarizeValues($dailyTable['MapsOpened']);
		$ret[] = [ 'Caption' => 'Uso de Google Maps key', 'Hits' => $mapsKey ];

		$addressKey = Arr::SummarizeValues($dailyTable['AddressQuery']);
		$ret[] = [ 'Caption' => 'Uso de Google Geocoder key', 'Hits' => $addressKey ];

		return $ret;
	}
	private function GetNewMonthUsers($month)
	{
		$year = intval(substr($month, 0, 4));
		$month = intval(substr($month, 5, 2));
		$firstDay = $year . "-" . $month . "-01";

		$nextYear = $year;
		$nextMonth = $month + 1;
		if ($nextMonth > 12)
		{
			$nextMonth = 1;
			$nextYear++;
		}
		$lastDay = $nextYear . "-" . $nextMonth . "-01";

		$sql = "SELECT COUNT(*) FROM user WHERE usr_create_time >= CAST('" . $firstDay . "' AS DATE) AND usr_create_time < CAST('" . $lastDay . "' AS DATE)";
		$ret = App::Db()->fetchScalarInt($sql);
		return $ret;
	}
	private function GetPossibleMonths()
	{
		$folder = Paths::GetStatisticsPath();
		$months = IO::GetDirectories($folder);
		rsort($months);
		return $months;
	}

	public function ProcessStatistics($month)
	{
		Profiling::BeginTimer();

		// Calcula el mes
		$data = $this->ProcessMonth($month);
		// Los inserta en la base de datos
		// 1. Limpia
		$clear = "DELETE FROM statistic WHERE sta_month = ?";
		App::Db()->exec($clear, array($month));
		// 2. Inserta metrics
		$sqlInsert = "INSERT INTO statistic (sta_element_id, sta_month, sta_type, sta_google, sta_hits) VALUES ";
		$values = $this->getInserts($data['metrics'], ['Google', 'Hits'], [ $month, 'M' ]);
		if ($values)
			App::Db()->exec($sqlInsert . $values);
		// 3. Inserta works
		$values = $this->getInserts($data['works'], ['Google', 'Hits', 'Downloads', 'Backoffice'], [ $month, 'W' ]);
		$sqlInsert = "INSERT INTO statistic (sta_element_id, sta_month, sta_type, sta_google, sta_hits, sta_downloads, sta_backoffice) VALUES ";
		if ($values)
			App::Db()->exec($sqlInsert . $values);

		if ($month != Date::GetLogMonthFolder())
		{
			$this->SaveDoneSummary($month);
		}
		Profiling::EndTimer();

		return self::OK;
	}

	private function SaveDoneSummary($month)
	{
		$folder = Paths::GetStatisticsPath() . "/" . $month;
		IO::WriteAllText($folder . '/doneSummary.txt', '');
	}

	private function IsSummarized($month)
	{
		$folder = Paths::GetStatisticsPath() . "/" . $month;
		return file_exists($folder . '/doneSummary.txt');
	}

	private function getInserts($data, $fields, $fixed)
	{
		$ret= "";
		foreach($data as $row)
		{
			$newRow = [ $row['Id'] ];
			foreach($fixed as $f)
				$newRow[] = Str::CheapSqlEscape($f);
			foreach($fields as $field)
				$newRow[] = Str::CheapSqlEscape($row[$field]);

			$ret .= ($ret != "" ? "," : '') . "(" . implode(",", $newRow) . ")";
		}
		return $ret;
	}

	private function ProcessMonth($month)
	{
		if ($month === null) throw new \Exception('Debe indicar el mes');

		Profiling::BeginTimer();

		$folder = Paths::GetStatisticsPath() . "/" . $month;
		$files = IO::GetFiles($folder, 'log');
		$works = [];
		$metrics = [];
		foreach($files as $file)
		{
			$workId = Str::RemoveEnding($file, '.log');
			$workId = intval(Str::RemoveBegining($workId, 'work'));
			$data = [];
			Statistics::ReadAndSummarizeWorkMonth($workId, $month, $data, null, false);

			$works[] = $this->ProcessWork($data, $workId);

			$this->ProcessMetrics($data, $metrics);
		}
		$metrics = Arr::ToArrFromKeyArr($metrics);
		Profiling::EndTimer();
		return ['works' => $works, 'metrics' => $metrics];
	}

	private function ProcessMetrics($data, &$metrics)
	{
		Profiling::BeginTimer();
		// Suma las consultas del metric
		$metricsInfo = $data['metric'];
		foreach($metricsInfo as $metricId => $values)
		{
			$this->EnsureExistsMetricInfo($metricId, $metrics);
			$metrics[$metricId]['Hits'] += $values['d0'];
		}

		// Suma los internal de google
		$internalsInfo = $data['internal'];
		foreach($internalsInfo as $key => $values)
		{
			if (Str::StartsWith($key, 'googleMetric'))
			{
				$metricId = intval(Str::RemoveBegining($key, 'googleMetric'));
				$this->EnsureExistsMetricInfo($metricId, $metrics);
				$metrics[$metricId]['Google'] += $values['d0'];
			}
		}
		Profiling::EndTimer();
	}

	private function EnsureExistsMetricInfo($metricId, &$metrics)
	{
		if (!array_key_exists($metricId, $metrics))
			$metrics[$metricId] = ['Hits' => 0, 'Google' => 0];
	}

	private function ProcessWork($data, $workId)
	{
		Profiling::BeginTimer();
		$hits = 0;
		$google = 0;
		$downloads = 0;
		$backoffice = 0;

		$workInfo = $data['work'];
		if (sizeof($workInfo) > 0)
		{
			if (array_key_exists('Consultas', $workInfo))
				$hits = $workInfo['Consultas']['d0'];
			if (array_key_exists('Descargas', $workInfo))
				$downloads = $workInfo['Descargas']['d0'];
		}
		$internalInfo = $data['internal'];
		if (sizeof($internalInfo) > 0)
		{
			if (array_key_exists('google', $internalInfo))
				$google = $internalInfo['google']['d0'];
			if (array_key_exists('backoffice', $internalInfo))
				$backoffice = $internalInfo['backoffice']['d0'];
		}

		$ret = [ 'Id' => $workId, 'Hits' => $hits, 'Downloads' => $downloads,
								'Google' => $google, 'Backoffice' => $backoffice ];
		Profiling::EndTimer();
		return $ret;
	}
}
