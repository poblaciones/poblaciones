<?php

namespace helena\services\frontend;

use minga\framework\Performance;
use minga\framework\PublicException;
use minga\framework\Log;

use helena\classes\GlobalTimer;
use helena\db\frontend\SnapshotByDatasetRanking;
use helena\caches\RankingCache;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\metric\RankingInfo;
use helena\entities\frontend\metric\RankingItemInfo;
use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\db\frontend\SnapshotByDatasetCompareRanking;

use helena\services\backoffice\publish\snapshots\MergeSnapshotsByDatasetModel;
use helena\services\common\BaseService;


class RankingService extends BaseService
{
	public function GetRanking($frame, $metricId, $metricVersionId, $levelId, $levelCompareId, $variableId,
							$hasTotals, $urbanity, $partition, $size, $direction, $hiddenValueLabels)
	{
		$data = null;
		$this->CheckNotNullNumeric($metricId);
		$this->CheckNotNullNumeric($metricVersionId);
		$this->CheckNotNumericNullable($levelId);

		if ($frame->ClippingRegionIds == NULL
			&& $frame->ClippingCircle == NULL && $frame->Envelope == null)
			throw new PublicException("Debe indicarse una delimitación espacial (zona, círculo o región).");

		$key = RankingCache::CreateKey($frame, $metricVersionId, $levelId, $levelCompareId, $size, $direction, $urbanity, $partition, $hasTotals, $hiddenValueLabels);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null && RankingCache::Cache()->HasData($metricId, $key, $data))
		{
			try
			{
				return $this->GotFromCache($data);
			}
			catch(\Exception $e)
			{
				Log::HandleSilentException($e);
				RankingCache::Cache()->Clear($metricId, $key);
			}
		}

		Performance::CacheMissed();
		$data = $this->CalculateRanking($frame, $metricId, $metricVersionId, $levelId, $levelCompareId, $variableId, $hasTotals, $urbanity, $partition, $size, $direction, $hiddenValueLabels);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null)
			RankingCache::Cache()->PutData($metricId, $key, $data);

		$data->EllapsedMs = GlobalTimer::EllapsedMs();

		return $data;
	}

	private function CalculateRanking($frame, $metricId, $metricVersionId, $levelId, $levelCompareId, $variableId, $hasTotals, $urbanity, $partition, $size, $direction, $hiddenValueLabels)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId);
		$version = $metric->GetVersion($metricVersionId);
		$level = $version->GetLevel($levelId);
		$hasDescriptions = $level->HasDescriptions;

		$snapshotTable = SnapshotByDatasetModel::SnapshotTable($level->Dataset->Table);
		if ($levelCompareId)
		{
			$levelCompare = $metric->GetLevel($levelCompareId);
			$mergeTable = MergeSnapshotsByDatasetModel::TableName($snapshotTable, $levelCompare->Dataset->Id);
			$compareVariable = MergeSnapshotsByDatasetModel::GetRequiredVariableForLevelPairObjects($level, $levelCompare, $variableId);
			$variableCompareId = $compareVariable->attributes['mvv_id'];
			$table = new SnapshotByDatasetCompareRanking(
				$mergeTable, $level->Dataset->Type,
				$variableId,
				$variableCompareId,
				$hasTotals,
				$urbanity,
				$partition,
				$hasDescriptions,
				$size,
				$direction,
				$hiddenValueLabels
			);
			MergeSnapshotsByDatasetModel::CheckTableExists($table->tableName, $level->Dataset->Id, $levelCompare->Dataset->Id);
		}
		else
		{
			$table = new SnapshotByDatasetRanking($snapshotTable, $level->Dataset->Type,
				$variableId, $hasTotals, $urbanity, $partition, $hasDescriptions, $size, $direction, $hiddenValueLabels);
		}

		$rows = $table->GetRows($frame);

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
			$item->ValueId = $row['ValueId'];
			// Agrega información comparativa
			if (array_key_exists('ValueCompare', $row) && $row['ValueCompare'] !== null)
				$item->ValueCompare = $row['ValueCompare'];
			if (array_key_exists('TotalCompare', $row) && $row['TotalCompare'] !== null)
				$item->TotalCompare = $row['TotalCompare'];

			$item->FID = $row['FeatureId'] ;
			$item->Name = $row['Name'];
			$item->Lat = $row['Lat'] ;
			$item->Lon = $row['Lon'];
			$item->Envelope = Envelope::FromDb($row['Envelope']);
			$ret->Items[] = $item;
		}
		return $ret;
	}
}

