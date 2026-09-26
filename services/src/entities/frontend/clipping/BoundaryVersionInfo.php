<?php

namespace helena\entities\frontend\clipping;

use helena\entities\BaseMapModel;

class BoundaryVersionInfo extends BaseMapModel
{
	public $Id;
	public $Name;
	public $Metadata;
	public $Count = null;
	public $IsSimpleCount = false;

	public $SelectedVersionIndex = 0;
	public $ValueLabels = [];
	// Envolvente geográfica de la versión (bvr_extents, tipo geometry): no
	// está en GetMap() porque llega cruda de la base y necesita convertirse
	// con Envelope::FromDb(), igual que Extents en SelectedMetricService.
	public $Extents = null;

	public static function GetMap()
	{
		return array (
			'bvr_id' => 'Id',
			'bvr_caption' => 'Name');
	}

}


