<?php

namespace helena\services\frontend;

use minga\framework\Profiling;

use minga\framework\Performance;
use helena\classes\GlobalTimer;
use helena\caches\TileDataCache;
use helena\services\common\BaseService;

use helena\db\frontend\SnapshotMetricVersionItemVariableModel;
use helena\db\frontend\SnapshotMetricVersionItemVariableModel_v2;
use helena\entities\frontend\clipping\TileDataInfo;
use helena\entities\frontend\geometries\Envelope;
use minga\framework\Context;


class TileDataService extends BaseService
{
	// Los niveles de zoom se mapean con la calidad de imagen
	// de modo que CALIDAD = Max(5, ((int)((zoom + 2) / 3))),
	// es decir que z[1 a 3] = C1, z[4 a 6] = C2, máximo C5.
	const TILE_SIZE = 256;

	public function GetBlockTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z, $b)
	{
		$s = Context::Settings()->Map()->TileDataBlockSize;
		$blocks = [];
		for($ix = $x; $ix < $x + $s; $ix++)
		{
			$row = [];
			for($iy = $y; $iy < $y + $s; $iy++)
			{
	 				$row[$iy] = $this->GetTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $ix, $iy, $z, $b);
			}
			$blocks[$ix] = $row;
		}
		$ret = new TileDataInfo();
		$ret->Data = $blocks;
		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		return $ret;
	}

	public function GetTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z, $b)
	{
		Profiling::BeginTimer();
		$data = null;
		$this->CheckNotNullNumeric($metricId);
		$this->CheckNotNullNumeric($metricVersionId);
		$this->CheckNotNumericNullable($levelId);
		$this->CheckNotNullNumeric($x);
		$this->CheckNotNullNumeric($y);
		$this->CheckNotNullNumeric($z);

		$key = TileDataCache::CreateKey($frame, $metricVersionId, $levelId, $urbanity, $x, $y, $z, $b);

		if ($frame->ClippingCircle == null && TileDataCache::Cache()->HasData($metricId, $key, $data))
		{
			Profiling::EndTimer();
			return $this->GotFromCache($data);
		}
		else
		{
			Performance::CacheMissed();
		}

		$data = $this->CalculateTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z, $b);

		if ($frame->ClippingCircle == null)
			TileDataCache::Cache()->PutData($metricId, $key, $data);

		Profiling::EndTimer();
		return $data;
	}

	private function CalculateTileData($frame, $metricId, $metricVersionId, $levelId, $urbanity, $x, $y, $z, $b)
	{
		$selectedService = new SelectedMetricService();
		$metric = $selectedService->GetSelectedMetric($metricId);
		$version = $metric->GetVersion($metricVersionId);
		$level = $version->GetLevel($levelId);
		if (Context::Settings()->Map()->NewPublishingMethod)
			$table = new SnapshotMetricVersionItemVariableModel_v2($level->Dataset->Table . "_snapshot");
		else
			$table = new SnapshotMetricVersionItemVariableModel();
		$gradientId = $level->GeographyId;

		if ($b != null)
		{
			$envelope = Envelope::TextDeserialize($b);
		}
		else
		{
			$envelope = Envelope::FromXYZ($x, $y, $z);
		}
		$hasDescriptions = $level->HasDescriptions;

		if ($frame->ClippingCircle != NULL)
		{
			$rows = $table->GetMetricVersionTileDataByCircle($metricVersionId, $level->Variables, $gradientId, $urbanity, $envelope, $frame->ClippingCircle, $level->Dataset->Type, $hasDescriptions);
		}
		else if ($frame->ClippingRegionId != NULL)
		{
			$rows = $table->GetMetricVersionTileDataByRegionId($metricVersionId, $level->Variables, $gradientId, $urbanity, $envelope, $frame->ClippingRegionId, $frame->ClippingCircle, $level->Dataset->Type, $hasDescriptions);
		}
		else
		{
			$rows = $table->GetMetricVersionTileDataByEnvelope($metricVersionId,  $level->Variables, $gradientId, $urbanity, $envelope, $level->Dataset->Type, $hasDescriptions);
		}

		$data = $this->CreateTileDataInfo($rows);

		return $data;
	}

	private function CreateTileDataInfo($rows)
	{
		$ret = new TileDataInfo();

		$ret->Data = $rows;

		$ret->EllapsedMs = GlobalTimer::EllapsedMs();
		return $ret;
	}
}

