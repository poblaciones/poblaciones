<?php

namespace helena\services\frontend;

use helena\services\common\BaseService;
use helena\caches\RankingCache;
use helena\db\frontend\SnapshotMetricVersionItemVariableModel;
use helena\entities\frontend\clipping\RankingInfo;
use helena\entities\frontend\clipping\RankingItemInfo;
use helena\classes\App;
use minga\framework\Performance;
use helena\classes\GlobalTimer;
use minga\framework\ErrorException;


class RankingService extends BaseService
{
	public function GetRanking($frame, $metricId, $metricVersionId, $levelId, $variableId, $hasTotals, $urbanity, $size, $direction)
	{
		$data = null;
		$this->CheckNotNullNumeric($metricId);
		$this->CheckNotNullNumeric($metricVersionId);
		$this->CheckNotNumericNullable($levelId);

		if ($frame->ClippingRegionId == NULL
			&& $frame->ClippingCircle == NULL && $frame->Envelope == null)
			throw new ErrorException("A spatial indication must be specified (envelope, circle or region).");

		$key = RankingCache::CreateKey($frame, $metricVersionId, $levelId, $size, $direction, $urbanity, $hasTotals);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null && RankingCache::Cache()->HasData($metricId, $key, $data))
		{
			return $this->GotFromCache($data);
		}
		else
		{
			Performance::CacheMissed();
		}
		$data = $this->CalculateRanking($frame, $metricId, $metricVersionId, $levelId, $variableId, $hasTotals, $urbanity, $size, $direction);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null)
			RankingCache::Cache()->PutData($metricId, $key, $data);

		$data->EllapsedMs = GlobalTimer::EllapsedMs();

		return $data;
	}

	private function CalculateRanking($frame, $metricId, $metricVersionId, $levelId, $variableId, $hasTotals, $urbanity, $size, $direction)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId);
		$version = $metric->GetVersion($metricVersionId);
		$level = $version->GetLevel($levelId);
		$hasDescriptions = $level->HasDescriptions;

		$table = new SnapshotMetricVersionItemVariableModel();
		$geographyId = $level->GeographyId;

		if ($frame->ClippingCircle != NULL)
		{
			$rows = $table->GetMetricVersionRankingByCircle($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $frame->ClippingCircle, $level->Dataset->Type, $hasDescriptions, $size, $direction);
		}
		else if ($frame->ClippingRegionId != NULL)
		{
			$rows = $table->GetMetricVersionRankingByRegionId($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $frame->ClippingRegionId, $frame->ClippingCircle, $level->Dataset->Type, $hasDescriptions, $size, $direction);
		}
		else
		{
			$rows = $table->GetMetricVersionRankingByEnvelope($metricVersionId, $geographyId, $variableId, $hasTotals, $urbanity, $frame->Envelope, $level->Dataset->Type, $hasDescriptions, $size, $direction);
		}
		$data = $this->CreateRankingInfo($rows);
		return $data;
	}

	private function CreateRankingInfo($rows)
	{
		$ret = new RankingInfo();
		foreach($rows as $row)
		{
			$item = new RankingItemInfo();
			$item->Value = $row['Value'] ;
			$item->Total = $row['Total'] ;
			$item->ValueId = $row['ValueId'] ;
			$item->FID = $row['FeatureId'] ;
			$item->Name = $row['Name'];
			$item->Lat = $row['Lat'] ;
			$item->Lon = $row['Lon'];
			$ret->Items[] = $item;
		}
		return $ret;
	}
}

