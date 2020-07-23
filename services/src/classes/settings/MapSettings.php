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
	public $UseKmz = false;
	public $UseGradients = false;
	public $UseFavorites = false;

	public $UseEmbedding = false;
	public $UseCreatePdf = false;
	public $UseCollapsePanel = false;
	public $UseUrbanity = false;

	public $MaxQueueRequests = 4;
	public $MaxStaticQueueRequests = 6;

	public $GoogleGeocodingArea = '';
}
