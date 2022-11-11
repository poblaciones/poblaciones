<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\caches\SummaryCache;
use helena\db\frontend\SnapshotByDatasetSummary;
use helena\entities\frontend\clipping\SummaryInfo;
use helena\entities\frontend\clipping\SummaryItemInfo;
use minga\framework\Context;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;

use minga\framework\Performance;
use helena\classes\GlobalTimer;
use minga\framework\PublicException;


class SummaryService extends BaseService
{
	public function GetSummary($frame, $metricId, $metricVersionId, $levelId, $urbanity, $partition)
	{
		$data = null;
		$this->CheckNotNullNumeric($metricId);
		$this->CheckNotNullNumeric($metricVersionId);
		$this->CheckNotNumericNullable($levelId);

		if ($frame->ClippingRegionIds == NULL
			&& $frame->ClippingCircle == NULL && $frame->Envelope == null)
			throw new PublicException("Debe indicarse una delimitación espacial (zona, círculo o región).");

		$key = SummaryCache::CreateKey($frame, $metricVersionId, $levelId, $urbanity, $partition);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null && SummaryCache::Cache()->HasData($metricId, $key, $data))
		{
			return $this->GotFromCache($data);
		}
		else
		{
			Performance::CacheMissed();
		}
		$data = $this->CalculateSummary($frame, $metricId, $metricVersionId, $levelId, $urbanity, $partition);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null)
			SummaryCache::Cache()->PutData($metricId, $key, $data);

		$data->EllapsedMs = GlobalTimer::EllapsedMs();

		return $data;
	}

	private function CalculateSummary($frame, $metricId, $metricVersionId, $levelId, $urbanity, $partition)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId);
		$version = $metric->GetVersion($metricVersionId);
		$level = $version->GetLevel($levelId);
		if (!$level->Partitions)
		{
			$partition = null;
		}
		else if (!$partition)
		{
			throw new \ErrorException("Debe indicar una valor para '" . $level->Partitions->Name . "'");
		}
		$snapshotTable = SnapshotByDatasetModel::SnapshotTable($level->Dataset->Table);
		$table = new SnapshotByDatasetSummary($snapshotTable, $level->Dataset->Type,
										$level->Variables, $urbanity, $partition);
		if (sizeof($level->Variables))
			$rows = $table->GetRows($frame);
		else
			$rows = [];
		$data = $this->CreateSummaryInfo($rows);
		return $data;
	}

	private function CreateSummaryInfo($rows)
	{
		$ret = new SummaryInfo();
		foreach($rows as $row)
		{
			$item = new SummaryItemInfo();
			$item->Value = $row['Value'] ;
			$item->Count = $row['Areas'] ;
			if (array_key_exists('Total', $row) && $row['Total'] !== null)
				$item->Total = $row['Total'] ;

			$item->Km2 = $row['Km2'] ;
			$item->VariableId = $row['VariableId'];
			$item->ValueId= $row['ValueId'];

			$ret->Items[] = $item;
		}
		return $ret;
	}
}

