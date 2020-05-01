<?php

namespace helena\classes\settings;

use helena\classes\App;

class MapSettings
{
	//Datos DB
	public $DefaultClippingRegion = '';

	public $LabelsBlockSize = 6;
	public $TileDataBlockSize = 4;

	public $UseTileBlocks = false;
	public $UseGradients = false;
	public $MaxQueueRequests = 5;
}
