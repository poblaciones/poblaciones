<?php

namespace helena\services\admin;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\Date;
use minga\framework\Context;
use minga\framework\Profiling;
use minga\framework\IO;

use helena\classes\App;
use helena\classes\Paths;
use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\backoffice\publish\PublishDataTables;

class StatisticsService extends BaseService
{
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
		App::Db()->exec($sqlInsert . $values);
		// 3. Inserta works
		$values = $this->getInserts($data['works'], ['Google', 'Hits', 'Downloads', 'Backoffice'], [ $month, 'W' ]);
		$sqlInsert = "INSERT INTO statistic (sta_element_id, sta_month, sta_type, sta_google, sta_hits, sta_downloads, sta_backoffice) VALUES " . $values;
		App::Db()->exec($sqlInsert);

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
		return ['Works' => $works, 'Metrics' => $metrics, 'Months' => $possible, 'IsSummarized' => $summarized];
	}

	private function GetPossibleMonths()
	{
		$folder = Paths::GetStatisticsPath();
		$months = IO::GetDirectories($folder);
		rsort($months);
		return $months;
	}
	private function processRegionData($data)
	{
		$currentCountry = Context::Settings()->currentCountry;
		$regions = $data['region'];
		if (sizeof($regions) == 0 || !$currentCountry) return [];
		$currentCountryValues = [];
		$otherCountriesValues = [];
		$currentCountryArray = [];
		$otherCountriesArray = [];
		// Llena los cortes de control y agrupa
		$separator = "\t";
		foreach($regions as $key => $values)
		{
			if (Str::StartsWith($key, $currentCountry . "|"))
			{
				$currentCountryValues = Arr::AddArrayKeys($currentCountryValues, $values);
				$subKey = substr($key, strlen($currentCountry) + 1);
				$currentCountryArray[$separator . $subKey] = $values;
			}
			else
			{
				$otherCountriesValues = Arr::AddArrayKeys($otherCountriesValues, $values);
				$otherCountriesArray[$separator . $key] = $values;
			}
		}
		// Ordena
		Arr::SortAssocByKey($otherCountriesArray, 'd0');
		Arr::SortAssocByKey($currentCountryArray, 'd0');
		// Hace un array con la combinación de todos
		$ret = [];
		if (sizeof($currentCountryArray) > 0) $ret = array_merge($ret, [$currentCountry => $currentCountryValues], $currentCountryArray);
		if (sizeof($otherCountriesArray) > 0) $ret = array_merge($ret, ['Otros' => $otherCountriesValues], $otherCountriesArray);

		return $ret;
	}

	private function processAttachmentData($data)
	{
		$attachments = $data['attachment'];
		if (sizeof($attachments) == 0) return [];
		$ids = Arr::RemoveByValue(array_keys($attachments), 'metadata');
		if (sizeof($ids) != 0)
		{
			$sql = "SELECT mfi_id Id, mfi_caption Caption FROM metadata_file WHERE mfi_id IN (" . Str::JoinInts($ids) . ")";
			$dictionary = App::Db()->fetchAll($sql);
			$dictionary[] = ['metadata', 'Metadatos'];
			$ret = Arr::ReplaceKeys($attachments, Arr::ToKeyArr($dictionary));
			Arr::SortAssocByKeyDesc($ret, 'd0');
			return $ret;
		}
		else
			return [];
	}

	private function processDownloadData($data)
	{
		$download = $data['download'];
		if (sizeof($download) == 0) return [];
		$ids = array_keys($download);
		if (sizeof($ids) != 0)
		{
			$sql = "SELECT dat_id Id, dat_caption Caption FROM dataset WHERE dat_id IN (" . Str::JoinInts($ids) . ")";
			$dictionary = App::Db()->fetchAll($sql);
			$ret = Arr::ReplaceKeys($download, Arr::ToKeyArr($dictionary));
			Arr::SortAssocByKeyDesc($ret, 'd0');
			return $ret;
		}
		else
			return [];
	}

	private function processHitsData($data)
	{
		$metrics = $data['metric'];
		if (sizeof($metrics) == 0) return [];

		$ids = array_keys($metrics);
		if (sizeof($ids) != 0)
		{
			$sql = "SELECT mtr_id Id, mtr_caption Caption FROM metric WHERE mtr_id IN (" . Str::JoinInts($ids) . ")";
			$dictionary = App::Db()->fetchAll($sql);
			$dictionary[] = ['work', 'Cartografía'];
			$ret = Arr::ReplaceKeys($metrics, Arr::ToKeyArr($dictionary));
			Arr::SortAssocByKeyDesc($ret, 'd0');
			return $ret;
		}
		else
			return [];
	}
}
