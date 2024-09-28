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
use helena\services\common\BaseDownloadManager;


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

		$metrics = $this->GetMetrics($month);

		$sqlDownloadTypes = "SELECT sta_element_id Id, '-' Caption, sta_hits Hits
										 FROM statistic WHERE sta_month = ? AND sta_type = 'D' ORDER BY sta_hits DESC";
		$downloadTypes = App::Db()->fetchAll($sqlDownloadTypes, array($month));
		$downloadTypes = $this->FormatDownloadTypes($downloadTypes);

		$summarized = $this->IsSummarized($month);

		// Arma el block de resumen mensual
		$dailyTable = Performance::GetDaylyTable($month);
		$totals = $this->CreateTotalHits($month, $dailyTable, $works, $metrics);
		$resources = $this->CreateTotalsResources($month, $dailyTable);

		// Embebidos
		$sqlEmbedding = "SELECT emb_host_url Host, GROUP_CONCAT(emb_map_url ORDER BY emb_hits DESC SEPARATOR '\t') as Maps,
											GROUP_CONCAT(emb_hits ORDER BY emb_hits DESC SEPARATOR '\t') as Hits FROM statistic_embedding
											WHERE emb_month = ?
											GROUP BY emb_host_url";
		$embedding = App::Db()->fetchAll($sqlEmbedding, array($month));
		foreach($embedding as &$row)
		{
			$row['Maps'] = explode("\t", $row['Maps']);
			$row['Hits'] = explode("\t", $row['Hits']);
		}
		return ['Totals' => $totals, 'Resources' => $resources, 'Works' => $works, 'Metrics' => $metrics, 'DownloadTypes' => $downloadTypes,'Months' => $possible, 'IsSummarized' => $summarized, 'Embedding' => $embedding ];
	}

	private function GetLastSummarizedMonth()
	{
		$offset = 1;
		while($offset < 100)
		{
			$month = Date::GetLogMonthFolder(-$offset);
			if ($this->IsSummarized($month))
				return $month;
			$offset++;
		}
		return null;
	}

	public function GetLastMonthTopMetrics($top = 15)
	{
		$month = $this->GetLastSummarizedMonth();
		if (!$month)
			return [];
		return $this->GetTopMetrics($month, $top);
	}

	public function GetTopMetrics($month, $limit)
	{
		$sqlMetrics = "SELECT mvw_metric_id myv_metric_id,
													mvw_metric_caption myv_metric_caption,
													mvw_metric_group_id myv_metric_group_id,
													mvw_metric_provider_id myv_metric_provider_id,
													mvw_metric_revision myv_metric_revision,
													GROUP_CONCAT(mvw_work_id ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_ids,
													GROUP_CONCAT(mvw_work_caption ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_captions,
													GROUP_CONCAT(mvw_metric_version_id ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_version_ids,
													GROUP_CONCAT(mvw_caption ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_version_captions,
													GROUP_CONCAT(mvw_work_is_private ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_is_private,
													GROUP_CONCAT(mvw_work_is_indexed ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_work_is_indexed,
													GROUP_CONCAT(IFNULL(mvw_partial_coverage, '') ORDER BY mvw_caption, mvw_metric_version_id SEPARATOR '\t') myv_version_partial_coverages,
													MAX(sta_hits) Hits
										 FROM statistic JOIN snapshot_metric_version ON sta_element_id = mvw_metric_id
						WHERE sta_month = ? AND sta_type = 'M'
						GROUP BY myv_metric_id, myv_metric_caption, myv_metric_group_id,
											myv_metric_provider_id, myv_metric_revision
						ORDER BY Hits DESC
						LIMIT " . $limit;

		$metrics = App::Db()->fetchAll($sqlMetrics, array($month));
		return $metrics;
	}

	public function GetMetrics($month, $limit = 0)
	{
		$sqlMetrics = "SELECT sta_element_id Id, mtr_caption Caption, sta_hits Hits, sta_downloads Downloads, sta_google Google, sta_backoffice Backoffice
										 FROM statistic JOIN metric ON sta_element_id = mtr_id
									WHERE sta_month = ? AND sta_type = 'M' ORDER BY sta_hits DESC";
		if ($limit)
			$sqlMetrics .= " LIMIT " . $limit;

		$metrics = App::Db()->fetchAll($sqlMetrics, array($month));
		return $metrics;
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

		$erros = Arr::SummarizeValues($dailyTable['Errores']);
		$ret[] = ['Caption' => 'Errors', 'Hits' => $erros];

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
	public function ProcessAllStatistics()
	{
		Profiling::BeginTimer();
		$possible = $this->GetPossibleMonths();
		foreach($possible as $month)
			$this->ProcessStatistics($month);
		Profiling::EndTimer();
		return $possible;

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
		// 4. Inserta tipos de descarga
		$values = $this->getInserts($data['downloadTypes'], ['Hits'], [ $month, 'D' ]);
		$sqlInsert = "INSERT INTO statistic (sta_element_id, sta_month, sta_type, sta_hits) VALUES ";
		if ($values)
			App::Db()->exec($sqlInsert . $values);

		if ($month != Date::GetLogMonthFolder())
		{
			$this->SaveDoneSummary($month);
		}
		App::Db()->markTableUpdate('statistic');
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
		$downloadTypes = [];
		foreach($files as $file)
		{
			$workId = Str::RemoveEnding($file, '.log');
			$workId = intval(Str::RemoveBegining($workId, 'work'));
			$data = [];
			Statistics::ReadAndSummarizeWorkMonth($workId, $month, $data, null, false, true);

			$works[] = $this->ProcessWork($data, $workId);

			$this->ProcessMetrics($data, $metrics);
			$this->ProcessDownloadTypes($data, $downloadTypes);
		}
		$metrics = Arr::ToArrFromKeyArr($metrics);
		$downloadTypes = Arr::ToArrFromKeyArr($downloadTypes);
		$downloadTypes = $this->DownloadTypesToNumeric($downloadTypes);

		Profiling::EndTimer();
		return ['works' => $works, 'metrics' => $metrics, 'downloadTypes' => $downloadTypes];
	}

	private function DownloadTypesToNumeric($downloadTypes)
	{
		foreach($downloadTypes as &$downloadType)
		{
			$code = $downloadType['Id'];
			if ($code === 'pdf')
			{
				$fileType = 355;
			}
			else
			{
				$fileType = BaseDownloadManager::GetFileTypeFromLetter(substr($code, 0, 1));
				$polygon = BaseDownloadManager::GetPolygon($code);
				if ($polygon && $fileType !== BaseDownloadManager::FILE_SHP)
				{
					$fileType += ($polygon == 'wkt' ? 100 : 200);
				}
			}
			$downloadType['Id'] = $fileType;
		}
		return $downloadTypes;
	}

	private function FormatDownloadTypes($downloadTypes)
	{
		$ret = [];
		foreach($downloadTypes as &$downloadType)
		{
			$code = $downloadType['Id'];
			$fileType = $code % 100;

			$this->EnsureExistsItemDownloads($fileType, $ret);

			$ret[$fileType]['Hits'] += $downloadType['Hits'];
			if ($code === 355)
			{
				$ret[$fileType]['Caption'] = 'PDF';
			}
			else
			{
				if ($code >= 200)
					$ret[$fileType]['GeoJson'] += $downloadType['Hits'];
				else if ($code >= 100)
					$ret[$fileType]['WKT'] += $downloadType['Hits'];
				else
					$ret[$fileType]['Datos'] += $downloadType['Hits'];
				$ret[$fileType]['Caption'] = BaseDownloadManager::GetFileCaptionFromFileType($fileType);
			}
		}
		$ret = Arr::ToArrFromKeyArr($ret);
		Arr::SortByKeyDesc($ret, 'Hits');
		return $ret;
	}

	private function ProcessDownloadTypes($data, &$downloadTypes)
	{
		Profiling::BeginTimer();
		// Suma los tipos de descarga
		$downloadTypesInfo = $data['downloadType'];
		foreach($downloadTypesInfo as $downloadType => $values)
		{
			$this->EnsureExistsItemHitsGoogle($downloadType, $downloadTypes);
			$downloadTypes[$downloadType]['Hits'] += $values['d0'];
		}
	}

	private function ProcessMetrics($data, &$metrics)
	{
		Profiling::BeginTimer();
		// Suma las consultas del metric
		$metricsInfo = $data['metric'];
		foreach($metricsInfo as $metricId => $values)
		{
			$this->EnsureExistsItemHitsGoogle($metricId, $metrics);
			$metrics[$metricId]['Hits'] += $values['d0'];
		}

		// Suma los internal de google
		$internalsInfo = $data['internal'];
		foreach($internalsInfo as $key => $values)
		{
			if (Str::StartsWith($key, 'googleMetric'))
			{
				$metricId = intval(Str::RemoveBegining($key, 'googleMetric'));
				$this->EnsureExistsItemHitsGoogle($metricId, $metrics);
				$metrics[$metricId]['Google'] += $values['d0'];
			}
		}
		Profiling::EndTimer();
	}

	private function EnsureExistsItemHitsGoogle($key, &$array)
	{
		self::EnsureExistsItem($key, $array, ['Hits' => 0, 'Google' => 0]);
	}
	private function EnsureExistsItemDownloads($key, &$array)
	{
		self::EnsureExistsItem($key, $array, ['Hits' => 0, 'Datos' => 0, 'WKT' => 0, 'GeoJson' => 0]);
	}

	private function EnsureExistsItem($key, &$array, $default)
	{
		if (!array_key_exists($key, $array))
			$array[$key] = $default;
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
