<?php

namespace helena\services\frontend;

use helena\caches\BoundaryCache;
use helena\caches\SelectedBoundaryCache;
use helena\classes\Clipper;

use helena\services\common\BaseService;
use helena\db\frontend\SnapshotBoundaryItemModel;
use helena\entities\frontend\clipping\FeaturesInfo;
use helena\entities\frontend\geometries\Envelope;
use helena\db\frontend\MetadataModel;

use helena\entities\frontend\clipping\BoundaryInfo;
use helena\entities\frontend\metadata\MetadataInfo;


class BoundaryService extends BaseService
{
	public function GetBoundary($boundaryId, $x, $y, $z, $b)
	{
		$data = null;
		$key = BoundaryCache::CreateKey($x, $y, $z, $b);
		if (BoundaryCache::Cache()->HasData($boundaryId, $key, $data))
		{
			return $this->GotFromCache($data);
		}

		$data = $this->CalculateBoundary($boundaryId, $x, $y, $z, $b);

		BoundaryCache::Cache()->PutData($boundaryId, $key, $data);

		return $data;
	}

	private function CalculateBoundary($boundaryId, $x, $y, $z, $b)
	{
		$table = new SnapshotBoundaryItemModel();

		if ($b != null)
		{
			$envelope = Envelope::TextDeserialize($b);
		}
		else
		{
			$envelope = Envelope::FromXYZ($x, $y, $z);
		}

		$rows = $table->GetBoundaryByEnvelope($boundaryId, $envelope, $z);

		$data = FeaturesInfo::FromRows($rows, true, false, $z, true);

		// recorta el cuadrado
		$clipper = new Clipper();
		$data->Data['features'] = $clipper->clipCollectionByEnvelope($data->Data['features'], $envelope);

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
		$table = new SnapshotBoundaryItemModel();

		$row = $table->GetSelectedBoundary($boundaryId);

		$item = new BoundaryInfo();
		$item->Fill($row);
		$item->Metadata = new MetadataInfo();
		$item->Metadata->Fill($row);

		$metadataTable = new MetadataModel();
		$rows = $metadataTable->GetMetadataFiles($item->Metadata->Id);
		$item->Metadata->FillFiles($rows);


		return $item;
	}
}

