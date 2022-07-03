<?php

namespace helena\services\backoffice;

use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\Date;
use minga\framework\Context;
use minga\framework\Profiling;

use helena\classes\App;
use helena\classes\Statistics;
use helena\services\common\BaseService;
use helena\services\backoffice\publish\PublishDataTables;

class StatisticsService extends BaseService
{
	public function GetWorkStatistics($workId, $month = null)
	{
		// cuando $month es nulo, trae los recientes

		$shardifiedWorkId = PublishDataTables::Shardified($workId);
		$data = Statistics::ReadAndSummarizeWorkLastPeriods($shardifiedWorkId, $month);
		// Reemplaza los ids por nombres de dataset
		$data['download'] = $this->processDownloadData($data);

		// Reemplaza los ids por nombres de indicadores
		$data['metric'] = $this->processHitsData($data);

		$this->SortHits($data['work']);

		// Reemplaza los ids por nombres de adjunto
		$data['attachment'] = $this->processAttachmentData($data);

		// Ordena los países con un corte de control
		$data['region'] = $this->processRegionData($data);

		return $data;
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
		$this->SortHits($otherCountriesArray);
		$this->SortHits($currentCountryArray);
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
			$keys = Arr::ToKeyArr($dictionary);
			$attachments = Arr::RemoveMissingKeys($attachments, $keys);
			$ret = Arr::ReplaceKeys($attachments, $keys);
			$this->SortHits($ret);
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
			$keys = Arr::ToKeyArr($dictionary);
			$download = Arr::RemoveMissingKeys($download, $keys);
			$ret = Arr::ReplaceKeys($download, $keys);
			$this->SortHits($ret);
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
			$keys = Arr::ToKeyArr($dictionary);
			$metrics = Arr::RemoveMissingKeys($metrics, $keys);
			$ret = Arr::ReplaceKeys($metrics, $keys);
			$this->SortHits($ret);
			return $ret;
		}
		else
			return [];
	}

	private function SortHits(&$arr)
	{
		uksort($arr, function($ak, $bk) use($arr) {
		$a = $arr[$ak];
		$b = $arr[$bk];
		if ($ak === "\tOtros")
			return 1;
		if ($bk === "\tOtros")
			return -1;

		if ($a['d0'] > $b['d0'])
			return -1;
		elseif ($a['d0'] < $b['d0'])
			return 1;
		else
			return strcmp($ak, $bk);
		});
	}
}
