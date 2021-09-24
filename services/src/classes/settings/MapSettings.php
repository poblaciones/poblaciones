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
	public $UseLightMap = false;
	public $ContentServerWorks = [];

	public $UseCalculated = true;

	public $UseMultiselect = false;
	public $UseGradients = false;
	public $UseTextures = false;
	public $UseFavorites = false;

	public $UseEmbedding = true;
	public $UseUrbanity = true;

	public $MaxQueueRequests = 5;
	public $MaxStaticQueueRequests = 10;

	public $GoogleGeocodingArea = '';
	public $GoogleMapsApi = "3.44";

	public $ExplicitRegionSearchResults = [];

	public $DefaultRelocateLocation = ['Lat' => -34.511498, 'Lon' => -63.903948];
}
