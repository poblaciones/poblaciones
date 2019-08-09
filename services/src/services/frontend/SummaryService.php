<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\caches\SummaryCache;
use helena\db\frontend\SnapshotMetricVersionItemVariableModel;
use helena\entities\frontend\clipping\SummaryInfo;
use helena\entities\frontend\clipping\SummaryItemInfo;
use helena\classes\App;
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

		if ($frame->ClippingFeatureId == NULL && $frame->ClippingRegionId == NULL
			&& $frame->ClippingCircle == NULL && $frame->Envelope == null)
			throw new ErrorException("A spatial indication must be specified (envelope, circle or region).");

		$key = SummaryCache::CreateKey($frame, $metricVersionId, $levelId);

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

		// calcula los summary (según indicado por campo 'resumen' en el ABM)
		// para cada categoría del metric indicado en la región clipeada.
		$table = new SnapshotMetricVersionItemVariableModel();
		$geographyId = $level->GeographyId;

		if ($frame->ClippingCircle != NULL)
		{
			$rows = $table->GetMetricVersionSummaryByCircle($metricVersionId, $level->HasSummary, $geographyId, $urbanity, $frame->ClippingCircle, $level->Dataset->Type);
		}
		else if ($frame->ClippingFeatureId != NULL)
		{
			$rows = $table->GetMetricVersionSummaryByFeatureId($metricVersionId, $level->HasSummary, $geographyId, $urbanity, $frame->ClippingFeatureId);
		}
		else if ($frame->ClippingRegionId != NULL)
		{
			$rows = $table->GetMetricVersionSummaryByRegionId($metricVersionId, $level->HasSummary, $geographyId, $urbanity, $frame->ClippingRegionId, $frame->ClippingCircle, $level->Dataset->Type);
		}
		else
		{
			$rows = $table->GetMetricVersionSummaryByEnvelope($metricVersionId, $level->HasSummary, $geographyId, $urbanity, $frame->Envelope);
		}
		$data = $this->CreateSummaryInfo($rows, $level->HasTotals);

		return $data;
	}

	private function CreateSummaryInfo($rows, $hasTotals)
	{
		$ret = new SummaryInfo();
		foreach($rows as $row)
		{
			$item = new SummaryItemInfo();
			$item->Value = $row['Value'] ;
			$item->Count = $row['Areas'] ;
			if ($hasTotals)
				$item->Total = $row['Total'] ;
			$item->Km2 = $row['Km2'] ;

			$item->VariableId = $row['VariableId'];
			$item->ValueId= $row['ValueId'];

			$ret->Items[] = $item;
		}
		return $ret;
	}
}

