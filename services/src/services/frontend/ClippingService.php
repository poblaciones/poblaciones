<?php
namespace helena\services\frontend;

use helena\services\common\BaseService;

use helena\caches\ClippingCache;
use helena\caches\ClippingSummaryCache;
use minga\framework\ErrorException;

use helena\entities\frontend\clipping\ClippingInfo;
use helena\entities\frontend\clipping\ClippingLevelInfo;
use helena\entities\frontend\clipping\SelectionInfo;

use helena\entities\frontend\metadata\MetadataInfo;

use helena\entities\frontend\geometries\Coordinate;
use helena\entities\frontend\geometries\Frame;
use helena\entities\frontend\geometries\Envelope;

use helena\classes\GlobalTimer;
use minga\framework\Profiling;
use minga\framework\GeoIp;

use helena\db\frontend\SnapshotClippingRegionItemModel;
use helena\db\frontend\ClippingRegionItemModel;


use helena\classes\App;
use helena\classes\GeoJson;

class ClippingService extends BaseService
{
	public function GetDefaultFrameAndClipping($current = null)
	{
		$frame = $this->GetDefaultFrame($current);
		$clipping = $this->CreateClipping($frame);
		$ret = array('frame' => $frame, 'clipping' => $clipping);
		return $ret;
	}

	public function GetDefaultFrame($current = null)
	{
		Profiling::BeginTimer();
		$frame = new Frame();
		$frame->ClippingRegionId = null;

		$table = new SnapshotClippingRegionItemModel();
		if ($current === null)
		{
			// Trata de resolver a IP a lat-long
			$latLng = null;// GeoIp::GetCurrentLatLong();
			if ($latLng !== null)
			{
				$current = new Coordinate($latLng['lat'], $latLng['lon']);
			}
		}
		if ($current != null)
		{
			// si recibió coordenadas, hace zoon al clipppingRegionItem
			// más chico que matchee.
			$item = $table->GetClippingRegionItemByLocation($current, false, 0.01);
			if ($item != null)
				$frame->ClippingRegionId = $item['Id'];
		}

		if ($frame->ClippingRegionId == null)
		{
			// si no las recibió o no había nada, abre en la primera de la
			// región con más prioridad
			$item = $table->GetFirstClippingRegion();
			if ($item == null)
				throw new ErrorException("The 'Region clipping views' has no data. Rebuild region clipping views.");
			$frame->ClippingRegionId = $item['Id'];
		}

		if ($frame->ClippingRegionId != null)
		{
			$item = $table->GetClippingRegionItemEnvelope($frame->ClippingRegionId);
			if ($item != null)
				$frame->Envelope = Envelope::FromDb($item['Envelope'])->Trim();
			else
				throw new ErrorException('La región de clipping indicada no pudo ser encontrada.');
		}
		// los demás los tiene que definir el cliente.
		$frame->Zoom = null;
		$frame->ClippingCircle = null;
		$frame->ClippingFeatureId = null;
		Profiling::EndTimer();
		return $frame;
	}

	public function CreateClippingByName($frame, $name)
	{
		$data = $this->CalculateClipping($frame,  0, $name);
		$data->EllapsedMs = GlobalTimer::EllapsedMs();
		return $data;
	}


	public function CreateClipping($frame, $levelId = 0)
	{
		Profiling::BeginTimer();
		$data = null;
		$frameKey = $levelId . "@" . $frame->GetClippingKey();
		if ($frame->HasClippingFactor() && ClippingCache::Cache()->HasData($frameKey, $data))
		{
			Profiling::EndTimer();
			return $this->GotFromCache($data);
		}
		$data = $this->CalculateClipping($frame,  $levelId);

		if ($frame->HasClippingFactor())
			ClippingCache::Cache()->PutData($frameKey, $data);
		$data->EllapsedMs = GlobalTimer::EllapsedMs();
		Profiling::EndTimer();
		return $data;
	}


	private function CalculateClipping($frame,  $levelId, $levelName = null)
	{
		$clipping = new ClippingInfo();

		GlobalTimer::Begin('CalculateLevels');
		$clipping->Levels = $this->CalculateLevels($frame);
		GlobalTimer::End();

		if (sizeof($clipping->Levels) == 0)
		{
			$clipping->Summary = null;
			$clipping->SelectedLevelIndex = -1;
		}
		else
		{
			if ($levelName == null)
				$clipping->SelectedLevelIndex = $clipping->GetLevelIndex($levelId, sizeof($clipping->Levels)-1);
			else
				$clipping->SelectedLevelIndex = $clipping->GetLevelIndexByName($levelName, sizeof($clipping->Levels)-1);

			GlobalTimer::Begin('CalculateSummary');
			$clipping->Summary = $this->CalculateSummary($frame, $clipping->Levels[$clipping->SelectedLevelIndex]->Id);
			GlobalTimer::End();
		}

		// resuelve el canvas para regionId
		if ($frame->ClippingCircle != null)
		{
			$geo = new GeoJson();
			$clipping->Canvas = $geo->GenerateFromEllipsis($frame->ClippingCircle);
			$clipping->Envelope = Envelope::FromCircle($frame->ClippingCircle)->Trim();
		}
		else if ($frame->ClippingRegionId != null)
		{ // resuelve el canvas para regionId
			$table = new ClippingRegionItemModel();
			$item = $table->GetClippingRegionItemGeometry($frame->ClippingRegionId);
			if ($item != null)
			{
				$geo = new GeoJson();
				$clipping->Canvas = $geo->GenerateFromBinary(array(array('name'=>'', 'value' => $item['Geometry'], 'FID' => $frame->ClippingRegionId)));
				$clipping->Envelope = Envelope::FromDb($item['Envelope'])->Trim();
			}
		}

		//$clipping->Stats = GlobalTimer::GetValues();
		return $clipping;
	}

	private function CalculateLevels($frame)
	{
		$table = new SnapshotClippingRegionItemModel();

		if ($frame->ClippingCircle != null)
		{
			// Actualiza región según círculo
			$rows = $table->CalculateLevelsFromPoint($frame->ClippingCircle->Center);
		}
		else if ($frame->ClippingFeatureId != null)
		{   // Calcula geography del feature
			// TODO
			return null;
		}
		else if ($frame->ClippingRegionId != null)
		{   // Calcula región
			$rows = $table->CalculateLevelsFromRegionId($frame->ClippingRegionId);
		}
		else if ($frame->Envelope != null)
		{
			$rows = $table->CalculateLevelsFromEnvelope($frame->Envelope);
		}
		else
		{
			throw new ErrorException('Frame has no spatial specification.');
		}

		$ret = array();
		foreach($rows as $row)
		{
			$item = new ClippingLevelInfo();
			$item->Fill($row);
			$item->Metadata = new MetadataInfo();
			$item->Metadata->Fill($row);
			$ret[] = $item;
		}
		return $ret;
	}

	public function GetSummary($frame, $levelId)
	{
		$data = null;
		$frameKey = $levelId + "@" + $frame->GetClippingKey();
		if (ClippingSummaryCache::Cache()->HasData($frameKey, $data))
		{
			return $this->GotFromCache($data);
		}

		$data = $this->CalculateSummary($frame, $levelId);

		ClippingSummaryCache::Cache()->PutData($frameKey, $data);
		$data->EllapsedMs = GlobalTimer::EllapsedMs();

		return $data;
	}

	private function CalculateSummary($frame, $levelId)
	{
		if ($frame->ClippingCircle != null)
		{
			// Actualiza región según círculo
			return $this->CalculateRegionFromCircle($frame->ClippingCircle, $levelId);
		}
		else if ($frame->ClippingFeatureId != null)
		{   // Calcula datos del feature
			// TODO
			return new SelectionInfo();
		}
		else if ($frame->ClippingRegionId != null)
		{   // Calcula región
			return $this->CalculateRegionFromId($frame->ClippingRegionId, $levelId);
		}
		else if ($frame->Envelope != null)
		{
			return $this->CalculateRegionFromEnvelope($frame->Envelope, $levelId);
		}
		else
		{
			throw new ErrorException('Frame has no spatial specification.');
		}
	}

	private function CalculateRegionFromId($clippingRegionId, $levelId)
	{
		$table = new SnapshotClippingRegionItemModel();
		$item = $table->GetSelectionInfoById($clippingRegionId, $levelId);
		if ($item != null)
			return $this->CreateSelectionInfo($clippingRegionId, $item);
		else
		{
			$ret = SelectionInfo::GetEmpty();
			$table = new ClippingRegionItemModel();
			$ret->Id = $clippingRegionId;
			$data = $table->GetClippingRegionItem($clippingRegionId);
			if ($data != null)
			{
				$ret->Name = $data['Name'];
				$ret->TypeName = $data['Type'];
				$ret->Location = Coordinate::FromDb($data['Location'])->Trim();
				$ret->Metadata = new MetadataInfo();
				$ret->Metadata->Fill($data);
			}
			return $ret;
		}
	}

	private function CalculateRegionFromEnvelope($envelope, $levelId)
	{
		$table = new SnapshotClippingRegionItemModel();
		$item = $table->GetSelectionInfoByEnvelope($envelope, $levelId);

		$info = $this->CreateSelectionInfo(null, $item);

		$info->Location = $envelope->GetCentroid()->Trim();

		return $info;
	}

	private function CalculateRegionFromCircle($circle, $levelId)
	{
		$table = new SnapshotClippingRegionItemModel();

		GlobalTimer::Begin('GetSelectionInfoByCircle');
		$item = $table->GetSelectionInfoByCircle($circle, $levelId);
		GlobalTimer::End();

		$info = $this->CreateSelectionInfo(null, $item);

		$info->Location = $circle->Center->Trim();

		GlobalTimer::Begin('GetClippingRegionItemByLocation');
		$region = $table->GetClippingRegionItemByLocation($circle->Center, true);
		GlobalTimer::End();
		if ($region != null)
		{
			$info->Name = "Selección en " . $region['Name'];
			$info->Metadata = new MetadataInfo();
			$info->Metadata->Fill($region);
		}
		return $info;
	}


	private function CreateSelectionInfo($clippingRegionId, $item)
	{
		$info = new SelectionInfo();

		$info->Id = $clippingRegionId;
		$info->Name = $item['Name'];
		$info->TypeName = $item['Type'];

		if (array_key_exists('Location', $item))
			$info->Location = Coordinate::FromDb($item['Location'])->Trim();

		$info->Population = intval($item['Population']);
		$info->Households = intval($item['Households']);
		$info->Children = intval($item['Children']);

		$info->AreaKm2 = $item['AreaM2'] / 1000 / 1000;
		$info->Metadata = new MetadataInfo();
		$info->Metadata->Fill($item);
		return $info;
	}

}

