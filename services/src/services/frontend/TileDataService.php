<?php

namespace helena\services\frontend;

use minga\framework\Performance;
use minga\framework\Profiling;

use helena\entities\frontend\clipping\FeaturesInfo;
use helena\classes\App;
use helena\classes\GlobalTimer;

use helena\caches\TileDataCache;
use helena\caches\LayerDataCache;
use helena\services\common\BaseService;

use helena\services\backoffice\publish\snapshots\SnapshotByDatasetModel;
use helena\services\backoffice\publish\snapshots\MergeSnapshotsByDatasetModel;

use helena\db\frontend\SnapshotByDatasetTileData;
use helena\db\frontend\SnapshotByDatasetCompareTileData;
use helena\entities\frontend\clipping\TileDataInfo;
use helena\entities\frontend\geometries\Envelope;


class TileDataService extends BaseService
{
	// Los niveles de zoom se mapean con la calidad de imagen
	// de modo que CALIDAD = Max(5, ((int)((zoom + 2) / 3))),
	// es decir que z[1 a 3] = C1, z[4 a 6] = C2, máximo C5.
	const TILE_SIZE = 256;

	public function GetBlockTileData($frame, $metricId, $metricVersionId, $levelId, $levelCompareId, $urbanity, $partition, $x, $y, $z)
	{
		$s = App::Settings()->Map()->TileDataBlockSize;
		$blocks = [];
		for($ix = $x; $ix < $x + $s; $ix++)
		{
			$row = [];
			for($iy = $y; $iy < $y + $s; $iy++)
			{
	 				$row[$iy] = $this->GetTileData($frame, $metricId, $metricVersionId, $levelId, $levelCompareId, $urbanity, $partition, $ix, $iy, $z);
			}
			$blocks[$ix] = $row;
		}
		$ret = new TileDataInfo();
		$ret->Data = $blocks;
		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		return $ret;
	}

	public function GetTileData($frame, $metricId, $metricVersionId, $levelId, $levelCompareId, $urbanity, $partition, $x, $y, $z)
	{
		Profiling::BeginTimer();
		$data = null;
		$this->CheckNotNullNumeric($metricId);
		$this->CheckNotNullNumeric($metricVersionId);
		$this->CheckNotNumericNullable($levelId);
		$this->CheckNotNullNumeric($x);
		$this->CheckNotNullNumeric($y);
		$this->CheckNotNullNumeric($z);

		$key = TileDataCache::CreateKey($frame, $metricVersionId, $levelId, $levelCompareId, $urbanity, $partition, $x, $y, $z);

		if ($frame->ClippingCircle == null && TileDataCache::Cache()->HasData($metricId, $key, $data))
		{
			Profiling::EndTimer();
			return $this->GotFromCache($data);
		}

		$data = $this->CalculateTileData($frame, $metricId, $metricVersionId, $levelId, $levelCompareId, $urbanity, $partition, $x, $y, $z);

		Performance::CacheMissed();
		Performance::SetMethod("get");

		if ($frame->ClippingCircle == null)
			TileDataCache::Cache()->PutData($metricId, $key, $data);

		Profiling::EndTimer();
		return $data;
	}


	public function GetLayerData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $partition)
	{
		Profiling::BeginTimer();
		$data = null;
		$this->CheckNotNullNumeric($metricId);
		$this->CheckNotNullNumeric($metricVersionId);
		$this->CheckNotNumericNullable($levelId);

		$data = $this->CalculateLayerData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $partition);

		Profiling::EndTimer();
		return $data;
	}


	private function CalculateTileData($frame, $metricId, $metricVersionId, $levelId, $levelCompareId, $urbanity, $partition, $x, $y, $z)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId);
		$version = $metric->GetVersion($metricVersionId);
		$level = $version->GetLevel($levelId);

		$snapshotTable = SnapshotByDatasetModel::SnapshotTable($level->Dataset->Table);

		$frame->TileEnvelope = Envelope::FromXYZ($x, $y, $z);

		$hasDescriptions = $level->HasDescriptions;
		$hasSymbols = $level->Dataset->Marker && $level->Dataset->Marker->Type !== 'N' &&  $level->Dataset->Marker->Source === 'V';

		if ($levelCompareId) {
			$levelCompare = $metric->GetLevel($levelCompareId);
			$mergeTable = MergeSnapshotsByDatasetModel::TableName($snapshotTable, $levelCompare->Dataset->Id);
			$variablePairs = MergeSnapshotsByDatasetModel::GetRequiredVariablesForLevelPairObjects($level, $levelCompare);
			$table = new SnapshotByDatasetCompareTileData(
				$mergeTable,
				$level->Dataset->Type, $level->Dataset->AreSegments,
				$variablePairs,
				$urbanity,
				$partition,
				$hasSymbols,
				$hasDescriptions
			);
			MergeSnapshotsByDatasetModel::CheckTableExists($table->tableName, $level->Dataset->Id, $levelCompare->Dataset->Id);
		} else {
			$table = new SnapshotByDatasetTileData(
				$snapshotTable,
				$level->Dataset->Type, $level->Dataset->AreSegments, $level->Variables,
				$urbanity,
				$partition,
				$hasSymbols,
				$hasDescriptions
			);
		}
		$rows = $table->GetRows($frame);

		if ($level->Dataset->AreSegments)
			$data = $this->CreateTileDataInfoWithGeometries($rows, $frame);
		else
			$data = $this->CreateTileDataInfo($rows);

		if (App::Settings()->Map()->UseTextures && $level->Dataset->TextureId)
		{
			$controller = new GradientService();
			$gradientId = $level->Dataset->TextureId;
			$gradient = $controller->GetGradient($gradientId);
			if ($gradient)
			{
				$gradientLimit = $gradient['grd_max_zoom_level'];
				$gradientType = $gradient['grd_image_type'];
				$data->Texture = $controller->GetGradientTile($gradientId, $gradientLimit, $gradientType, $x, $y, $z);
			}
		}
		return $data;
	}

	private function CalculateLayerData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $partition)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId);
		$version = $metric->GetVersion($metricVersionId);
		$level = $version->GetLevel($levelId);

		$snapshotTable = SnapshotByDatasetModel::SnapshotTable($level->Dataset->Table);

		$frame->TileEnvelope = "full";

		$hasDescriptions = $level->HasDescriptions;
		$hasSymbols = $level->Dataset->Marker && $level->Dataset->Marker->Type !== 'N' &&  $level->Dataset->Marker->Source === 'V';

		$table = new SnapshotByDatasetTileData($snapshotTable,
											$level->Dataset->Type, $level->Dataset->AreSegments, $level->Variables,
													$urbanity, $partition, $hasSymbols, $hasDescriptions);

		$table->honorTileLimit = false;

		$rows = $table->GetRows($frame);

		if ($level->Dataset->AreSegments)
			$data = $this->CreateTileDataInfoWithGeometries($rows, $frame);
		else
			$data = $this->CreateTileDataInfo($rows);
		/*
		if (App::Settings()->Map()->UseTextures && $level->Dataset->TextureId)
		{
			$controller = new GradientService();
			$gradientId = $level->Dataset->TextureId;
			$gradient = $controller->GetGradient($gradientId);
			if ($gradient)
			{
				$gradientLimit = $gradient['grd_max_zoom_level'];
				$gradientType = $gradient['grd_image_type'];
				$data->Texture = $controller->GetGradientTile($gradientId, $gradientLimit, $gradientType, $x, $y, $z);
			}
		}*/
		return $data;
	}
	private function CreateTileDataInfo($rows)
	{
		$ret = new TileDataInfo();
		$ret->Data = $rows;
		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		return $ret;
	}
	private function CreateTileDataInfoWithGeometries($rows, $frame)
	{
		$ret = new TileDataInfo();
		FeaturesInfo::ProcessGeometry($rows, true, true, $frame->Zoom, false, $frame->TileEnvelope);
		$ret->Data = $rows;
		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		return $ret;
	}
}

