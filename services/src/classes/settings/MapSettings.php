<?php

namespace helena\classes\settings;

use helena\classes\App;

class MapSettings
{
	//Datos DB
	public $DefaultClippingRegion = '';

	public $LabelsBlockSize = 6;
	public $TileDataBlockSize = 4;

	public $UseDataTileBlocks = false;
	public $UseLabelTileBlocks = true;

	public $ContentServerWorks = [];

	public $UseCalculated = false;

	public $UseGradients = false;
	public $MaxQueueRequests = 4;
	public $MaxStaticQueueRequests = 6;
}
