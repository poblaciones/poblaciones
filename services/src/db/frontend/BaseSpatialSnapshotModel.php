<?php

namespace helena\db\frontend;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Profiling;
use helena\classes\DatasetTypeEnum;

use minga\framework\QueryPart;
use minga\framework\MultiQuery;
use helena\classes\GeoJson;

abstract class BaseSpatialSnapshotModel extends BaseModel
{
	protected $spatialConditions;
	protected $preffix;
	protected $datasetType;

	protected abstract function ExecQuery($query = null, $extraQuery = null);

	public function __construct($snapshotTable, $preffix, $datasetType)
	{
		$this->tableName = $snapshotTable;
		$this->preffix= $preffix;
		$this->datasetType = $datasetType;

		$this->spatialConditions = new SpatialConditions($preffix);
	}

	public function GetRows($frame)
	{
		if ($frame->ClippingCircle != NULL)
		{
			$rows = $this->GetByCircle($frame);
		}
		else if ($frame->ClippingRegionIds != NULL)
		{
			$rows = $this->GetByRegionIds($frame);
		}
		else
		{
			$rows = $this->GetByEnvelope($frame);
		}
		return $rows;
	}

	public function GetByRegionIds($frame)
	{
		if ($this->datasetType === 'B')
			$query =  $this->spatialConditions->CreateRegionToRegionQuery($frame->ClippingRegionIds);
		else
			$query =  $this->spatialConditions->CreateRegionQuery($frame->ClippingRegionIds);

		$tileQuery = $this->GetTileQuery($frame);

		return $this->ExecQuery($query, $tileQuery);
	}

	public function GetByEnvelope($frame)
	{
		if ($frame->TileEnvelope)
			$query = $this->GetTileQuery($frame);
		else
			$query = $this->spatialConditions->CreateEnvelopeQuery($frame->Envelope);

		return $this->ExecQuery($query);
	}

	public function GetTileQuery($frame)
	{
		if ($frame->TileEnvelope)
			return $this->spatialConditions->CreateEnvelopeQuery($frame->TileEnvelope);
		else
			return null;
	}
	public function GetByCircle($frame)
	{
		$query =  $this->spatialConditions->CreateCircleQuery($frame->ClippingCircle, $this->datasetType);

		$tileQuery = $this->GetTileQuery($frame);

		return $this->ExecQuery($query, $tileQuery);
	}
}


