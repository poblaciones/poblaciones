<?php

namespace helena\classes\settings;

use helena\classes\App;
use minga\framework\Arr;
use minga\framework\Str;
use minga\framework\Request;
use minga\framework\Context;

class MapSettings
{
	const OPENFREEMAP_ATTRIBUTION =
		"<a class='copyrightText exp-hiddable-unset' target='_blank' href='https://openfreemap.org'>© OpenFreeMap</a> " .
		"<a class='copyrightText exp-hiddable-unset' target='_blank' href='https://www.openmaptiles.org/'>© OpenMapTiles</a> " .
		"<a class='copyrightText exp-hiddable-unset' target='_blank' href='https://www.openstreetmap.org/copyright'>© OpenStreetMap</a>";

	const CARTO_ATTRIBUTION =
		"<a class='copyrightText exp-hiddable-unset' target='_blank' href='https://www.openstreetmap.org/copyright'>© OpenStreetMap</a> " .
		"<a class='copyrightText exp-hiddable-unset' target='_blank' href='https://carto.com/attributions'>© CARTO</a>";

	public $DefaultClippingRegion = '';

	public $LabelsBlockSize = 6;
	public $TileDataBlockSize = 4;

	public $CurrentCountryId = 7314;

	public $UseDataTileBlocks = false;
	public $UseLabelTileBlocks = true;
	public $UseLightMap = false;
	public $UsePerimeter = false;
	public $ContentServerWorks = [];
	public $BasemapMetrics = [];
	public $BoundaryRecommendationExclusions = [];
	public $MetricsFavoritesExclusions = [];

	public $Rasters = [];
	public $ElevationUrl = null;
	public $ShortUrlPattern = null;

	public $UseCalculated = true;

	public $UseDeckgl = true;

	public $UseCompareSeries = true;
	public $UseUploadFromMap = false;

	public $isOWSEnabled = false;

	public $UseMultiselect = true;
	public $DefaultPivotBoundaryId = null;
	public $DefaultPivotSubBoundaryId = null;
	public $DefaultPivotSubSubBoundaryId = null;

	public $UsePivot = false;
	public $UseNewMenu = false;
	public $UseGap = false;

	public $UseGradients = false;
	public $UseTextures = false;
	public $UseFavorites = false;

	public $UseAnnotations = false;

	public $UseNewFabButton = true;

	public $BasemapUrls = [];
	public $BasemapAttributions = [];

	public $UseEmbedding = true;
	public $UseUrbanity = true;

	public $UseCharts = true;

	public $NAAN = null;

	public $MapsAPI = "leaflet";

	public $MaxQueueRequests = 5;
	public $MaxStaticQueueRequests = 10;

	public $GoogleGeocodingArea = '';
	public $GoogleMapsApi = "quarterly";

	// REMOVE
	public $LearnResources = [];

	public $SignatureSuffix = null;
	public $ExplicitRegionSearchResults = [];

	public $OwnerLogo = [ 'Name' => '', 'Image' => '', 'Url' => ''];


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



	public function __construct()
	{
		$this->SetCartoBasemaps();
	}

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
	public function SetCartoBasemaps()
	{
		$this->BasemapUrls = [
			'roadmap' => "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png?key=YOUR_KEY",
			'roadmap_no_labels' => "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png?key=YOUR_KEY",
			'colored' => "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=YOUR_KEY",
			'colored_no_labels' => "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png?key=YOUR_KEY",
			'roadmap_only_labels' => "https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png?key=YOUR_KEY",
			'satellite' => "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
			];

		$this->BasemapAttributions = [
			'roadmap' => self::CARTO_ATTRIBUTION,
			'roadmap_no_labels' => self::CARTO_ATTRIBUTION,
			'roadmap_only_labels' => self::CARTO_ATTRIBUTION,
			'colored' => self::CARTO_ATTRIBUTION,
			'colored_no_labels' => self::CARTO_ATTRIBUTION,
			'satellite' => ''
		];
	}


	public function SetCartoVectorBasemaps()
	{
		$this->BasemapUrls = [
			'roadmap' => "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json?key=YOUR_KEY",
			'roadmap_no_labels' => "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json?key=YOUR_KEY",
			'colored' => "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json?key=YOUR_KEY",
			'colored_no_labels' => "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json?key=YOUR_KEY",
			'roadmap_only_labels' => "https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png?key=YOUR_KEY",
			'satellite' => "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
			];

		$this->BasemapAttributions = [
			'roadmap' => self::CARTO_ATTRIBUTION,
			'roadmap_no_labels' => self::CARTO_ATTRIBUTION,
			'roadmap_only_labels' => self::CARTO_ATTRIBUTION,
			'colored' => self::CARTO_ATTRIBUTION,
			'colored_no_labels' => self::CARTO_ATTRIBUTION,
			'satellite' => ''
		];
	}

	public function SetOpenTilesBasemaps()
	{
		$this->BasemapUrls = [
			'roadmap' => 'https://tiles.openfreemap.org/styles/positron',
			'roadmap_no_labels' => 'https://tiles.openfreemap.org/styles/positron',
			'roadmap_only_labels' => 'https://tiles.openfreemap.org/styles/positron',
			'colored' => 'https://tiles.openfreemap.org/styles/bright',
			'colored_no_labels' => 'https://tiles.openfreemap.org/styles/bright',
			'satellite' => "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
		];

		$this->BasemapAttributions = [
			'roadmap' => self::OPENFREEMAP_ATTRIBUTION,
			'roadmap_no_labels' => self::OPENFREEMAP_ATTRIBUTION,
			'roadmap_only_labels' => self::OPENFREEMAP_ATTRIBUTION,
			'colored' => self::OPENFREEMAP_ATTRIBUTION,
			'colored_no_labels' => self::OPENFREEMAP_ATTRIBUTION,
			'satellite' => ''
		];
	}

	public function SetBasemapUrlsKey($key)
	{
		foreach($this->BasemapUrls as $map => $value)
			$this->BasemapUrls[$map] = Str::Replace($this->BasemapUrls[$map], "YOUR_KEY", $key);
	}
}
