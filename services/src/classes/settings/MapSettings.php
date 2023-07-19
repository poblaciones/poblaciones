<?php

namespace helena\classes\settings;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Request;
use minga\framework\Context;

class MapSettings
{
	//Datos DB
	public $DefaultClippingRegion = '';

	public $LabelsBlockSize = 6;
	public $TileDataBlockSize = 4;

	public $UseDataTileBlocks = false;
	public $UseLabelTileBlocks = true;
	public $UseLightMap = false;
	public $UsePerimeter = false;
	public $ContentServerWorks = [];

	public $UseCalculated = true;

	public $UseDeckgl = true;

	public $isOWSEnabled = false;

	public $UseMultiselect = false;
	public $UseNewMenu = false;

	public $UseGradients = false;
	public $UseTextures = false;
	public $UseFavorites = false;

	public $UseEmbedding = true;
	public $UseUrbanity = true;

	public $MapsAPI = "google";

	public $MaxQueueRequests = 5;
	public $MaxStaticQueueRequests = 10;

	public $GoogleGeocodingArea = '';
	public $GoogleMapsApi = "quarterly";

	public $SignatureSuffix = null;
	public $ExplicitRegionSearchResults = [];

	public $Autocomplete = ['capital buenos aires' => 'la plata',
													'capital chaco' => 'resistencia', 'capital chubut' => 'trelew',
													'capital entre ríos' => 'paraná', 'capital entre rios' => 'paraná',
													'capital formosa' => 'formosa', 'capital jujuy' => 'san salvador de jujuy',
													'capital misiones' => 'posadas', 'capital neuquén' => 'municipios neuquén',
													'capital neuquen' => 'municipios neuquén', 'capital río negro' => 'viedma',
													'capital rio negro' => 'viedma', 'capital santa cruz' => 'río gallegos',
													'capital tierra del fuego' => 'ushuaia',
													'buenos aires capital' => 'la plata',
													'chaco capital' => 'resistencia', 'chubut capital' => 'trelew',
													'entre ríos capital' => 'paraná', 'entre rios capital' => 'paraná',
													'formosa capital' => 'formosa', 'jujuy capital' => 'san salvador de jujuy',
													'misiones capital' => 'posadas', 'neuquén capital' => 'municipios neuquén',
													'neuquen capital' => 'municipios neuquén', 'río negro capital' => 'viedma',
													'rio negro capital' => 'viedma', 'santa cruz capital' => 'río gallegos',
													'tierra del fuego capital' => 'ushuaia',
													'capital federal' => 'ciudad autónoma de buenos aires',
													'provincia buenos aires' => 'provincia buenos aires -colorado',
													'clubes' => 'club'
													];
	public $Stopwords = ['de', 'numero', 'número'];

	public $DefaultRelocateLocation = ['Lat' => -34.511498, 'Lon' => -63.903948];

	public function RegisterMultiServer($validServers, $homeUrl = null)
	{
		$current = Arr::IndexOf($validServers, "https://" . Request::Host());
		if ($current == -1)
			$current = Arr::IndexOf($validServers, "http://" . Request::Host());

		$server = $validServers[($current !== -1 ? $current : 0)];
		if ($current > 0)
			App::Settings()->Map()->SignatureSuffix = Request::Subdomain();

		// Servidor
		Context::Settings()->Servers()->RegisterServers($server, $homeUrl);
	}
}
