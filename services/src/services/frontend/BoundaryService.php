<?php

namespace helena\services\frontend;

use helena\caches\BoundaryCache;
use helena\caches\BoundarySummaryCache;
use helena\caches\SelectedBoundaryCache;
use helena\classes\Clipper;
use helena\classes\GeoJson;

use helena\services\common\BaseService;
use helena\db\frontend\BoundaryModel;
use helena\db\frontend\SnapshotBoundaryVersionItemModel;
use helena\db\frontend\SnapshotBoundarySummary;
use helena\entities\frontend\clipping\FeaturesInfo;
use minga\framework\PublicException;
use minga\framework\Performance;
use helena\classes\GlobalTimer;

use helena\classes\ClipperRound;
use helena\db\frontend\MetadataModel;
use helena\entities\frontend\geometries\Envelope;
use helena\entities\frontend\geometries\Coordinate;

use helena\entities\frontend\clipping\BoundaryInfo;
use helena\entities\frontend\clipping\BoundaryVersionInfo;
use helena\entities\frontend\clipping\BoundarySummaryInfo;
use helena\entities\frontend\metadata\MetadataInfo;


class BoundaryService extends BaseService
{
	public function GetBoundary($frame, $boundaryVersionId)
	{
		$data = null;

		if ($frame->ClippingRegionIds == NULL
			&& $frame->ClippingCircle == NULL && $frame->Envelope == null && $frame->TileEnvelope == null)
			throw new PublicException("Debe indicarse una delimitación espacial (zona, círculo o región).");
		$key = BoundaryCache::CreateKey($frame);
		if (BoundaryCache::Cache()->HasData($boundaryVersionId, $key, $data))
		{
			return $this->GotFromCache($data);
		}

		$data = $this->CalculateBoundary($frame, $boundaryVersionId);

		BoundaryCache::Cache()->PutData($boundaryVersionId, $key, $data);

		return $data;
	}

	private function CalculateBoundary($frame, $boundaryVersionId)
	{
		$table = new SnapshotBoundaryVersionItemModel($boundaryVersionId);
		$table->zoom = $frame->Zoom;

		$rows = $table->GetRows($frame);

		$tileEnvelope = $frame->TileEnvelope;
		$data = FeaturesInfo::FromRows($rows, true, true, $frame->Zoom, true, $tileEnvelope);

		// recorta el cuadrado
		$tileEnvelope = new Envelope(new Coordinate(0,0), new Coordinate(GeoJson::TILE_PRJ_SIZE, GeoJson::TILE_PRJ_SIZE));
		$clipper = new ClipperRound();
		$data->Data['features'] = $clipper->clipCollectionByEnvelope($data->Data['features'], $tileEnvelope);
		return $data;
	}

	public function GetSelectedBoundary($boundaryId)
	{
		$data = null;
		$key = SelectedBoundaryCache::CreateKey($boundaryId);
		if (SelectedBoundaryCache::Cache()->HasData($key, $data))
		{
			return $this->GotFromCache($data);
		}

		$data = $this->CalculateSelectedBoundary($boundaryId);

		SelectedBoundaryCache::Cache()->PutData($key, $data);

		return $data;
	}

	private function CalculateSelectedBoundary($boundaryId)
	{
		$table = new BoundaryModel();

		$row = $table->GetSelectedBoundary($boundaryId);

		$item = new BoundaryInfo();
		$item->Fill($row);

		$versions = $table->GetSelectedBoundaryVersions($boundaryId);

		foreach($versions as $row)
		{
			$version = new BoundaryVersionInfo();
			$version->Fill($row);
			$version->Metadata = new MetadataInfo();
			$version->Metadata->Fill($row);

			$metadataTable = new MetadataModel();
			$rows = $metadataTable->GetMetadataFiles($version->Metadata->Id);
			$version->Metadata->FillFiles($rows);

			$item->Versions[] = $version;
			$version->SelectedVersionIndex = sizeof($item->Versions) - 1;
		}

		$item->SelectedVersionIndex = sizeof($item->Versions) - 1;

		return $item;
	}


	public function GetSummary($frame, $boundaryVersionId)
	{
		$data = null;

		if ($frame->ClippingRegionIds == NULL
			&& $frame->ClippingCircle == NULL && $frame->Envelope == null)
			throw new PublicException("Debe indicarse una delimitación espacial (zona, círculo o región).");

		$key = BoundarySummaryCache::CreateKey($frame);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null && BoundarySummaryCache::Cache()->HasData($boundaryVersionId, $key, $data))
		{
			return $this->GotFromCache($data);
		}
		else
		{
			Performance::CacheMissed();
		}
		$data = $this->CalculateSummary($frame, $boundaryVersionId);

		if ($frame->HasClippingFactor() && $frame->ClippingCircle == null)
			BoundarySummaryCache::Cache()->PutData($boundaryVersionId, $key, $data);

		$data->EllapsedMs = GlobalTimer::EllapsedMs();

		return $data;
	}

	private function CalculateSummary($frame, $boundaryVersionId)
	{
		$table = new SnapshotBoundarySummary($boundaryVersionId);

		$rows = $table->GetRows($frame);

		$data = new BoundarySummaryInfo();
		$data->Count = $rows[0]['itemCount'];
		$data->BoundaryVersionId = $boundaryVersionId;
		return $data;
	}

}

