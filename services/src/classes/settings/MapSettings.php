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

	public $UseMultiselect = false;
	public $UseGradients = false;
	public $UseTextures = false;
	public $UseFavorites = false;

	public $UseEmbedding = false;
	public $UseUrbanity = true;

	public $MaxQueueRequests = 4;
	public $MaxStaticQueueRequests = 6;

	public $LoopLocalPort = null;

	public $GoogleGeocodingArea = '';

	public $DefaultRelocateLocation = ['Lat' => -34.511498, 'Lon' => -63.903948];
}
