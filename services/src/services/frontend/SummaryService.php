<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\caches\SummaryCache;
use helena\db\frontend\SnapshotByDataset;
use helena\entities\frontend\clipping\SummaryInfo;
use helena\entities\frontend\clipping\SummaryItemInfo;
use minga\framework\Context;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;

use minga\framework\Performance;
use helena\classes\GlobalTimer;
use minga\framework\ErrorException;


class SummaryService extends BaseService
{
	public function GetSummary($frame, $metricId, $metricVersionId, $levelId, $urbanity)
	{
		$data = null;
		$this->CheckNotNullNumeric($metricId);
		$this->CheckNotNullNumeric($metricVersionId);
		$this->CheckNotNumericNullable($levelId);

		if ($frame->ClippingRegionIds == NULL
			&& $frame->ClippingCircle == NULL && $frame->Envelope == null)
			throw new ErrorException("A spatial indication must be specified (envelope, circle or region).");

		$key = SummaryCache::CreateKey($frame, $metricVersionId, $levelId, $urbanity);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null && SummaryCache::Cache()->HasData($metricId, $key, $data))
		{
			return $this->GotFromCache($data);
		}
		else
		{
			Performance::CacheMissed();
		}
		$data = $this->CalculateSummary($frame, $metricId, $metricVersionId, $levelId, $urbanity);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null)
			SummaryCache::Cache()->PutData($metricId, $key, $data);

		$data->EllapsedMs = GlobalTimer::EllapsedMs();

		return $data;
	}

	private function CalculateSummary($frame, $metricId, $metricVersionId, $levelId, $urbanity)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId);
		$version = $metric->GetVersion($metricVersionId);
		$level = $version->GetLevel($levelId);

		$snapshotTable = SnapshotByDatasetModel::SnapshotTable($level->Dataset->Table);
		$table = new SnapshotByDataset($snapshotTable);
		$gradientId = $level->GeographyId;

		if ($frame->ClippingCircle != NULL)
		{
			$rows = $table->GetMetricVersionSummaryByCircle($metricVersionId, $level->Variables, $level->HasSummary, $gradientId, $urbanity, $frame->ClippingCircle, $level->Dataset->Type);
		}
		else if ($frame->ClippingRegionIds != NULL)
		{
			$rows = $table->GetMetricVersionSummaryByRegionIds($metricVersionId, $level->Variables, $level->HasSummary, $gradientId, $urbanity, $frame->ClippingRegionIds, $frame->ClippingCircle, $level->Dataset->Type);
		}
		else
		{
			$rows = $table->GetMetricVersionSummaryByEnvelope($metricVersionId, $level->Variables, $level->HasSummary, $gradientId, $urbanity, $frame->Envelope);
		}
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

