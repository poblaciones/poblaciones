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
		$isDefaultRegion = false;
		$frame = $this->GetDefaultFrameRegion($current, $isDefaultRegion);
		$clipping = $this->CreateClipping($frame);
		$ret = array('frame' => $frame, 'clipping' => $clipping, 'isDefaultRegion' => $isDefaultRegion);
		return $ret;
	}

	public function GetDefaultFrame($current = null)
	{
		Profiling::BeginTimer();
		$frame = new Frame();
		$frame->ClippingRegionId = null;

		if ($current === null)
		{
			// Trata de resolver a IP a lat-long
			$latLng = GeoIp::GetCurrentLatLong();
			if ($latLng !== null)
			{
				$current = new Coordinate($latLng['lat'], $latLng['lon']);
			}
		}
		$frame->Center = $current;
		$frame->ClippingRegionId = null;
		$frame->ClippingCircle = null;
		$frame->ClippingFeatureId = null;
		$zoneInfo = $this->GetDefaultFrameAndClipping($current);
		$frame->Zoom = 11;
		if ($zoneInfo['isDefaultRegion'])
		{
			$frame->Center = $zoneInfo['frame']->Envelope->GetCentroid();
		}
		$density = $zoneInfo['clipping']->Summary->Population / $zoneInfo['clipping']->Summary->AreaKm2;
		if ($density < 100)
		 	$frame->Zoom = 12;
		if ($density > 10000)
		 	$frame->Zoom = 10;
		$frame->Envelope = new Envelope($frame->Center, $frame->Center);
		Profiling::EndTimer();
		return $frame;
	}

	public function GetDefaultFrameRegion($current = null, &$isDefaultRegion = false)
	{
		Profiling::BeginTimer();
		$frame = new Frame();
		$frame->ClippingRegionId = null;

		$table = new SnapshotClippingRegionItemModel();
		if ($current === null)
		{
			// Trata de resolver a IP a lat-long
			$latLng = GeoIp::GetCurrentLatLong();
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
			$isDefaultRegion = true;
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

	public function CreateClipping($frame, $levelId = 0, $name = null, $urbanity = null)
	{
		Profiling::BeginTimer();
		$data = null;
		$frameKey = ClippingCache::CreateKey($frame, $levelId, $name, $urbanity);
		if ($frame->HasClippingFactor() && ClippingCache::Cache()->HasData($frameKey, $data))
		{
			Profiling::EndTimer();
			return $this->GotFromCache($data);
		}
		$data = $this->CalculateClipping($frame, $levelId, $name, $urbanity);

		if ($frame->HasClippingFactor())
			ClippingCache::Cache()->PutData($frameKey, $data);
		$data->EllapsedMs = GlobalTimer::EllapsedMs();
		Profiling::EndTimer();
		return $data;
	}

	private function CalculateClipping($frame, $levelId, $levelName, $urbanity)
	{
		$clipping = new ClippingInfo();

		GlobalTimer::Begin('CalculateLevels');

		$forcetrackingLevels = ($urbanity !== null);

		$clipping->Levels = $this->CalculateLevels($frame, $forcetrackingLevels);
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
			$clipping->Summary = $this->CalculateSummary($frame, $clipping->Levels[$clipping->SelectedLevelIndex]->Id, $urbanity);
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
				$clipping->Canvas['features'][0]['geometry']['coordinates'] =  GeoJson::TrimRecursive($clipping->Canvas['features'][0]['geometry']['coordinates']);
				$clipping->Envelope = Envelope::FromDb($item['Envelope'])->Trim();
			}
		}

		//$clipping->Stats = GlobalTimer::GetValues();
		return $clipping;
	}

	private function CalculateLevels($frame, $forceTrackingLevels)
	{
		$table = new SnapshotClippingRegionItemModel();

		if ($frame->ClippingCircle != null)
		{
			// Actualiza región según círculo
			$rows = $table->CalculateLevelsFromPoint($frame->ClippingCircle->Center);
		}
		else if ($frame->ClippingRegionId != null)
		{   // Calcula región
			$rows = $table->CalculateLevelsFromRegionId($frame->ClippingRegionId, $forceTrackingLevels);
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

	private function CalculateSummary($frame, $levelId, $urbanity)
	{
		if ($frame->ClippingCircle != null)
		{
			// Actualiza región según círculo
			return $this->CalculateRegionFromCircle($frame->ClippingCircle, $levelId, $urbanity);
		}
		else if ($frame->ClippingRegionId != null)
		{   // Calcula región
			return $this->CalculateRegionFromId($frame->ClippingRegionId, $levelId, $urbanity);
		}
		else if ($frame->Envelope != null)
		{
			return $this->CalculateRegionFromEnvelope($frame->Envelope, $levelId, $urbanity);
		}
		else
		{
			throw new ErrorException('Frame has no spatial specification.');
		}
	}

	private function CalculateRegionFromId($clippingRegionId, $levelId, $urbanity)
	{
		$table = new SnapshotClippingRegionItemModel();
		$item = $table->GetSelectionInfoById($clippingRegionId, $levelId, $urbanity);
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

	private function CalculateRegionFromEnvelope($envelope, $levelId, $urbanity)
	{
		$table = new SnapshotClippingRegionItemModel();
		$item = $table->GetSelectionInfoByEnvelope($envelope, $levelId, $urbanity);

		$info = $this->CreateSelectionInfo(null, $item);

		$info->Location = $envelope->GetCentroid()->Trim();

		return $info;
	}

	private function CalculateRegionFromCircle($circle, $levelId, $urbanity)
	{
		$table = new SnapshotClippingRegionItemModel();

		GlobalTimer::Begin('GetSelectionInfoByCircle');
		$item = $table->GetSelectionInfoByCircle($circle, $levelId, $urbanity);
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

