import TxtOverlay from '@/public/googleMaps/TxtOverlay';
import TileOverlay from '@/public/googleMaps/TileOverlay';
import Mercator from '@/public/js/Mercator';
import FeatureSelector from './FeatureSelector';
import h from '@/public/js/helper';
import { setTimeout } from 'core-js';

export default GoogleMapsApi;

function GoogleMapsApi(google) {
	this.google = google;
	this.gMap = null;
	this.drawingManager = null;
	this.dragging = false;
	this.draggingDelayed = false;
	this.idle = true;
	this.myLocationMarker = null;
	this.isSettingZoom = false;
	this.clippingCanvas = null;
	this.selector = new FeatureSelector(this);
	this.allwaysHiddenElements = ['landscape.natural', 'landscape.natural.landcover', 'landscape.natural.terrain',
																	'poi.attraction', 'administrative.locality',
																	'administrative.country', 'administrative.province'];
	this.labelElements = ['administrative.land_parcel', 'administrative.neighborhood', 'landscape.man_made',
													'poi.business', 'poi.government', 'poi.medical', 'poi.park', 'poi.place_of_worship',
													'poi.school', 'poi.sports_complex', 'transit', 'water' ];
	this.allwaysVisibleElements = ['road'];
	this.setColorElements = ['poi.medical', 'poi.business'];
};

GoogleMapsApi.prototype.UpdateLabelsVisibility = function(showLabels) {
	var styles = this.generateLabelsArray(showLabels);
	this.gMap.setOptions({styles: styles });
};

GoogleMapsApi.prototype.WaitForFullLoading = function () {
	var targetCall;
	var readyPromise = new Promise(resolve => {
		targetCall = resolve;
	});
	if (this.idle) {
		targetCall();
	} else {
		this.google.maps.event.addListenerOnce(this.gMap, 'idle', function () {
			targetCall();
		});
	}
	return readyPromise;
};

GoogleMapsApi.prototype.Write = function(text, location, zIndex, style, innerStyle, ignoreMapMode, type, hidden) {
	if(!style) {
		style = 'mapLabels';
	}
	if (!ignoreMapMode && this.IsSatelliteType()) {
		style += ' sat';
	}
	var overlay = new TxtOverlay(this.gMap, location, text, style, zIndex, innerStyle, type, hidden);
	return overlay;
};

GoogleMapsApi.prototype.Initialize = function () {
	if(window.SegMap === null) {
		throw new Error('segmentedMap is null. Call SetSegmentedMap.');
	}

	var myMapOptions = {
		mapTypeControlOptions: {
			style: this.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
			position: google.maps.ControlPosition.TOP_LEFT,
			mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'blank'],
		},
		scaleControl: true,
		styles: this.generateLabelsArray(true),
		clickableIcons: false,
		center: { lat: -37.1799565, lng: -65.6866910 },
		zoom: 6
	};
	if (window.Embedded.Active) {
		if (window.Embedded.Readonly) {
			myMapOptions.zoomControl = false;
			myMapOptions.gestureHandling = 'none';
			myMapOptions.disableDefaultUI = true;
		}
		if (window.Embedded.Compact) {
			myMapOptions.scaleControl = false;
		}
		if (!window.Embedded.Readonly) {
			myMapOptions.fullscreenControl = false;
		}
	}
	if (window.SegMap.Configuration.UseLightMap) {
		myMapOptions.mapTypeControlOptions.mapTypeIds.unshift('light');
	}
	var blankMapType = this.CreateBlankMap();
	this.gMap = new this.google.maps.Map(document.getElementById('map'), myMapOptions);
	this.gMap.mapTypes.set('blank', blankMapType);

	if (window.SegMap.Configuration.UseLightMap) {
		var lightMapType = this.CreateLightMap();
		this.gMap.mapTypes.set('light', lightMapType);
	}
	this.AddCopyright();
	this.CreateDrawingManager();
	this.drawingManager.setMap(this.gMap);
	this.SetOpenNewWindowLink();
	//this.gMap.setTilt(45);
	//https://developers.google.com/maps/documentation/javascript/maptypes#Rotating45DegreeImagery

	var loc = this;
	this.google.maps.event.addListenerOnce(this.gMap, 'idle', function () {
		window.SegMap.MapInitialized();
	});
};

GoogleMapsApi.prototype.SetOpenNewWindowLink = function () {
	if (!window.Embedded.Active) {
		return;
	}
	for (var h of document.links) {
		if (h.title.startsWith("Abrir esta área en Google")) {
//			alert('found');
		}
	}
};

GoogleMapsApi.prototype.generateLabelsArray = function (visibility) {
	var ret = [];
	// https://mapstyle.withgoogle.com/
	for (var ele in this.labelElements) {
		var item = this.labelElements[ele];
		var feature = { featureType: item, elementType: 'labels', stylers: [{ visibility: (visibility ? 'on' : 'off') }] };
		if (this.setColorElements.includes(item)) {
			feature.stylers.push({ "saturation": -45 }, { "lightness": +40 });
		}
		ret.push(feature);
	}
	for (var ele in this.allwaysHiddenElements) {
		ret.push({ featureType: this.allwaysHiddenElements[ele], elementType: 'labels', stylers: [{ visibility: 'off' }] });
	}
	return ret;
};

GoogleMapsApi.prototype.BindEvents = function () {
	var loc = this;
	this.gMap.addListener('bounds_changed', function () {
		loc.idle = false;
		if (loc.dragging === false) {
			window.SegMap.FrameMoved(loc.getBounds());
			window.SegMap.BoundsChanged();
		}
	});

	this.gMap.addListener('idle', function () {
		loc.idle = true;
	});
	this.gMap.addListener('zoom_changed', function () {
		//	if (loc.isSettingZoom === false) {
		window.SegMap.ZoomChanged(loc.gMap.getZoom());
	});
	this.gMap.addListener('dragstart', function () {
		loc.dragging = true;
		loc.draggingDelayed = true;
	});
	this.gMap.addListener('dragend', function () {
		loc.dragging = false;
		window.SegMap.BoundsChanged();
		setTimeout(() => {
			loc.draggingDelayed = false;
		}, 250);

//		event.stopPropagation();
	});

	this.gMap.addListener('maptypeid_changed', function () {
		window.SegMap.MapTypeChanged(loc.GetMapTypeState());
		window.SegMap.SaveRoute.UpdateRoute();
		loc.UpdateClippingStyle();
	});
	this.google.maps.event.addListener(this.drawingManager, 'circlecomplete', function (circle) {
		loc.CircleCompleted(circle);
	});
};

GoogleMapsApi.prototype.AddCopyright = function () {
	var controlDiv = document.createElement('DIV');
	var innerHTML = "<div class='copyrightText'>";
	if (window.Embedded.Active) {
		innerHTML += "<a class='copyrightText' href='https://poblaciones.org/' target='_blank'>";
	}
	innerHTML += "Poblaciones © 2020 CONICET / ODSA - UCA</a>. " +
		"<a class='copyrightText' href='https://poblaciones.org/terminos/' target='_blank'>Términos y Condiciones</a>. ";
	if (!window.Embedded.Active) {
		innerHTML += "<a class='copyrightText exp-hiddable-unset' title='Comentarios y sugerencias a Poblaciones' href='https://poblaciones.org/contacto/' target='_blank'><i class='far fa-comments contacto'></i> Contacto</a>";
	}
	innerHTML += "</div> ";
	controlDiv.innerHTML = innerHTML;
	controlDiv.className = "copyright";
	controlDiv.index = 0;
	this.gMap.controls[this.google.maps.ControlPosition.BOTTOM_RIGHT].push(controlDiv);

};


GoogleMapsApi.prototype.StopDrawing = function () {
	this.drawingManager.setDrawingMode(null);
};

GoogleMapsApi.prototype.BeginDrawingCircle = function () {
	this.drawingManager.setDrawingMode('circle');
};

GoogleMapsApi.prototype.TriggerResize = function () {
	this.google.maps.event.trigger(this.gMap, 'resize');
};

GoogleMapsApi.prototype.ClearMyLocationMarker = function () {
	if (this.myLocationMarker !== null) {
		this.myLocationMarker.setMap(null);
		this.myLocationMarker = null;
	}
};


GoogleMapsApi.prototype.CreateMyLocationMarker = function (coord) {
	this.ClearMyLocationMarker();
	var pos = new this.google.maps.LatLng(coord.Lat, coord.Lon);

	// Create a marker and center map on user location
	this.myLocationMarker = new this.google.maps.Marker({
		position: pos,
		draggable: true,
		zIndex: 1000 * 1000,
		optimized: false,
		animation: this.google.maps.Animation.DROP,
		map: this.gMap
	});
	var loc = this;
	this.myLocationMarker.addListener("click", () => {

		 const infowindow = new google.maps.InfoWindow({
			 content: 'Lat: ' + loc.myLocationMarker.position.lat().toFixed(6) + ", " +
							  'Lon: ' + loc.myLocationMarker.position.lng().toFixed(6)
		});
    infowindow.open(loc.gMap, loc.myLocationMarker);
  });
};


GoogleMapsApi.prototype.CreateDrawingManager = function () {
	this.drawingManager = new this.google.maps.drawing.DrawingManager({
		drawingMode: null,
		drawingControl: false,
		drawingControlOptions: {
			position: this.google.maps.ControlPosition.BOTTOM_LEFT,
			drawingModes: ['circle', 'marker']
		},
		circleOptions: {
			fillColor: '#aaa',
			fillOpacity: this.getOpacity(),
			strokeWeight: 1,
			clickable: false,
			editable: false,
			zIndex: 1
		}
	});
};

GoogleMapsApi.prototype.CircleCompleted = function (circle) {
	this.StopDrawing();

	var radius = circle.getBounds().getNorthEast();
	var center = circle.getCenter();

	var clippingCircle = {
		Center: {
			Lat: h.trimNumberCoords(center.lat()),
			Lon: h.trimNumberCoords(center.lng()),
		},
		Radius: {
			Lat: h.trimNumberCoords(Math.abs(radius.lat() - center.lat())),
			Lon: h.trimNumberCoords(Math.abs(radius.lng() - center.lng())),
		},
	};
	window.SegMap.Clipping.SetClippingCircle(clippingCircle);

	//borra el círculo
	circle.setMap(null);
	window.SegMap.SetSelectionMode(0);
};

GoogleMapsApi.prototype.SetCenter = function (coord) {
	var c = new this.google.maps.LatLng(coord.Lat, coord.Lon);
	this.gMap.setCenter(c);
};

GoogleMapsApi.prototype.calculateOffsetX = function (offsetXpixels) {
	var offsetRad = 0;
	if (offsetXpixels) {
		var ret = this.point2LatLng({ x: offsetXpixels, y: 0 }, this.gMap);
		var ret2 = this.point2LatLng({ x: 0, y: 0 }, this.gMap);
		offsetRad = (ret.lng() - ret2.lng()) / 2;
	}
	return offsetRad;
};

GoogleMapsApi.prototype.PanTo = function (coord, offsetXpixels) {
	var offsetRad = this.calculateOffsetX(offsetXpixels);
	var c = new this.google.maps.LatLng(coord.Lat, coord.Lon - offsetRad);
	this.gMap.panTo(c);
};

GoogleMapsApi.prototype.point2LatLng = function (point, map) {
	var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
	var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
	var scale = Math.pow(2, map.getZoom());
	var worldPoint = new google.maps.Point(point.x / scale + bottomLeft.x, point.y / scale + topRight.y);
	return map.getProjection().fromPointToLatLng(worldPoint);
};

GoogleMapsApi.prototype.SetTypeControlsDropDown = function () {
	this.SetTypeControls(this.google.maps.MapTypeControlStyle.DROPDOWN_MENU);
};

GoogleMapsApi.prototype.SetTypeControlsDefault = function () {
	this.SetTypeControls(this.google.maps.MapTypeControlStyle.HORIZONTAL_BAR);
};

GoogleMapsApi.prototype.SetTypeControls = function (controlType) {
	var types = ['roadmap', 'satellite', 'hybrid', 'terrain', 'blank'];
	if (window.SegMap.Configuration.UseLightMap) {
		types.push('light');
	}
	this.gMap.setOptions({
		mapTypeControlOptions: {
			style: controlType,
			mapTypeIds: types,
		},
	});
};

GoogleMapsApi.prototype.SetZoom = function (zoom) {
	this.isSettingZoom = true;
	this.gMap.setZoom(zoom);
	this.isSettingZoom = false;
};

GoogleMapsApi.prototype.FitEnvelope = function (envelopeOrig, exactMatch, offsetX) {
	var envelope;
	if (exactMatch) {
		envelope = envelopeOrig;
	} else {
		envelope = h.scaleEnvelope(envelopeOrig, .75);
	}
	var min = new this.google.maps.LatLng(envelope.Min.Lat, envelope.Min.Lon);
	var max = new this.google.maps.LatLng(envelope.Max.Lat, envelope.Max.Lon);
	var bounds = new this.google.maps.LatLngBounds();
	bounds.extend(min);
	bounds.extend(max);
	this.gMap.fitBounds(bounds);
	if (offsetX) {
		var pos = this.gMap.getCenter();
		var offsetRad = this.calculateOffsetX(offsetX);
		this.gMap.setCenter(new this.google.maps.LatLng(pos.lat(), pos.lng() - offsetRad));
	}
};

GoogleMapsApi.prototype.ClearClippingCanvas = function () {
	if (this.clippingCanvas !== null) {
		var loc = this;
		this.clippingCanvas.forEach(function (feature) {
			// If you want, check here for some constraints.
			loc.gMap.data.remove(feature);
		});
		this.clippingCanvas = null;
	}
};

GoogleMapsApi.prototype.GetMapTypeState = function () {
	if (!this.gMap) {
		return '';
	}
	var ret = this.gMap.getMapTypeId().substr(0, 1);
	if (this.gMap.getTilt() === 45) {
		ret += 'd';
		var rot = this.gMap.getHeading();
		if (rot > 0) {
			ret += (rot / 90);
		}
	}
	return ret;
};

GoogleMapsApi.prototype.IsSatelliteType = function () {
	if (!this.gMap) {
		return false;
	}
	var type = this.gMap.getMapTypeId();
	return (type == 'satellite' || type == 'hybrid');
};

GoogleMapsApi.prototype.SetMapTypeState = function (mapTypeState) {
	var mapType;
	switch (mapTypeState.substr(0, 1)) {
	case 'r':
		mapType = 'roadmap';
		break;
	case 't':
		mapType = 'terrain';
		break;
	case 's':
		mapType = 'satellite';
		break;
	case 'h':
		mapType = 'hybrid';
			break;
	case 'l':
		mapType = 'light';
		break;
	case 'b':
		mapType = 'blank';
		break;
	default:
		return;
	}
	this.gMap.setMapTypeId(mapType);
	if (mapTypeState.length >= 2 && mapTypeState.substr(1, 1) === 'd') {
		this.gMap.setTilt(45);
		if (mapTypeState.length >= 3) {
			var head = parseInt(mapTypeState.substr(2, 1)) * 90;
			this.gMap.setHeading(head);
		}
	} else {
		this.gMap.setTilt(0);
	}

};

GoogleMapsApi.prototype.getOpacity = function () {
	if(this.gMap.getMapTypeId() === 'roadmap') {
		return 0.15;
	} else if(this.gMap.getMapTypeId() === 'terrain') {
		return 0.15;
	} else if(this.gMap.getMapTypeId() === 'satellite') {
		return 0.4;
	} else if(this.gMap.getMapTypeId() === 'hybrid') {
		return 0.4;
	} else if (this.gMap.getMapTypeId() === 'light') {
		return 0.4;
	} else if (this.gMap.getMapTypeId() === 'blank') {
		return 0.4;
	} else { // Default
		return 0.15;
	}
};

GoogleMapsApi.prototype.UpdateClippingStyle = function () {
	this.gMap.data.setStyle({
		strokeWeight: 1,
		fillOpacity: this.getOpacity(),
		strokeColor: '#aaa',
		clickable: false,
	});
};

GoogleMapsApi.prototype.SetClippingCanvas = function (canvasList) {
	this.ClearClippingCanvas();

	var zeroItem = [
		[0, 90],
		[180, 90],
		[180, -90],
		[0, -90],
		[-180, -90],
		[-180, 0],
		[-180, 90],
		[0, 90]
	];
	var featureMask = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }};
	featureMask.geometry.coordinates.push(zeroItem);

	for (var c = 0; c < canvasList.length; c++) {
		var canvas = canvasList[c];
		if (canvas.features[0].geometry.type === 'MultiPolygon') {
			var polygons = canvas.features[0].geometry.coordinates;
			for (var p = 0; p < polygons.length; p++) {
				for (var i = 0; i < polygons[p].length; i++) {
					featureMask.geometry.coordinates.push(polygons[p][i]);
				}
			}
		} else {
			// polygon
			featureMask.geometry.coordinates = featureMask.geometry.coordinates.concat(
													canvas.features[0].geometry.coordinates);
		}
	}
	var mask = { type: 'FeatureCollection', features: [featureMask] };

	this.UpdateClippingStyle();
	this.clippingCanvas = this.gMap.data.addGeoJson(mask);
};

GoogleMapsApi.prototype.markerClicked = function (event, metricVersion, fid) {
	if (this.draggingDelayed) {
		return;
	}
	window.SegMap.InfoWindow.InfoRequestedInteractive(h.getPosition(event), metricVersion, fid);
};

GoogleMapsApi.prototype.getBounds = function() {
	var ne = this.gMap.getBounds().getNorthEast();
	var sw = this.gMap.getBounds().getSouthWest();
	return {
		Min: {
			Lat: h.trimNumberCoords(ne.lat()),
			Lon: h.trimNumberCoords(ne.lng()),
		},
		Max: {
			Lat: h.trimNumberCoords(sw.lat()),
			Lon: h.trimNumberCoords(sw.lng()),
		},
		Zoom: this.gMap.getZoom(),
	};
};

GoogleMapsApi.prototype.InsertSelectedMetricOverlay = function (activeMetric, index) {
//	this.google.maps.event.trigger(this.gMap, 'resize');
	this.gMap.overlayMapTypes.insertAt(index,
		new TileOverlay(this.gMap, this.google, activeMetric));
};

GoogleMapsApi.prototype.RemoveOverlay = function (index) {
	this.gMap.overlayMapTypes.getAt(index).dispose();
	this.gMap.overlayMapTypes.removeAt(index);
};

GoogleMapsApi.prototype.PaintOverlay = function (index) {
	var overlay = this.gMap.overlayMapTypes.getAt(index);
	overlay.previewHandler.savePreviewData();
	setTimeout(() => {
		this.gMap.overlayMapTypes.removeAt(index + 1);
	}, 50);
	this.gMap.overlayMapTypes.insertAt(index, overlay);
};


GoogleMapsApi.prototype.CreateLightMap = function () {
	var elements = [
		{
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#ececec"
				}
			]
		},
		{
			"elementType": "labels.icon",
			"stylers": [
				{
					"visibility": "off"
				}
			]
		},
		{
			"elementType": "labels.text.fill",
			"stylers": [
				{
					"color": "#616161"
				}
			]
		},
		{
			"elementType": "labels.text.stroke",
			"stylers": [
				{
					"color": "#ececec"
				}
			]
		},
		{
			"featureType": "administrative.land_parcel",
			"elementType": "labels.text.fill",
			"stylers": [
				{
					"color": "#bdbdbd"
				}
			]
		},
		{
			"featureType": "poi",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#eeeeee"
				}
			]
		},
		{
			"featureType": "poi",
			"elementType": "labels.text.fill",
			"stylers": [
				{
					"color": "#757575"
				}
			]
		},
		{
			"featureType": "poi.park",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#e5e5e5"
				}
			]
		},
		{
			"featureType": "poi.park",
			"elementType": "labels.text.fill",
			"stylers": [
				{
					"color": "#9e9e9e"
				}
			]
		},
		{
			"featureType": "road",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#ffffff"
				}
			]
		},
		{
			"featureType": "road.arterial",
			"elementType": "labels.text.fill",
			"stylers": [
				{
					"color": "#757575"
				}
			]
		},
		{
			"featureType": "road.highway",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#dadada"
				}
			]
		},
		{
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
				{
					"weight": 0.5
				}
			]
		},
		{
			"featureType": "road.highway",
			"elementType": "labels.text.fill",
			"stylers": [
				{
					"color": "#616161"
				}
			]
		},
		{
			"featureType": "road.local",
			"elementType": "labels.text.fill",
			"stylers": [
				{
					"color": "#9e9e9e"
				}
			]
		},
		{
			"featureType": "transit.line",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#e5e5e5"
				}
			]
		},
		{
			"featureType": "transit.station",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#eeeeee"
				}
			]
		},
		{
			"featureType": "water",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#ffffff"
				}
			]
		},
		{
			"featureType": "water",
			"elementType": "labels.text.fill",
			"stylers": [
				{
					"color": "#9e9e9e"
				}
			]
		}
	];
	var labels = this.generateLabelsArray(true);

	var styledMapType = new this.google.maps.StyledMapType(
		elements.concat(labels),
		{ name: 'v2' });

	return styledMapType;
};

GoogleMapsApi.prototype.CreateBlankMap = function () {
	var styledMapType = new this.google.maps.StyledMapType(
		[
			{
				'featureType': 'all',
				'elementType': 'geometry.stroke',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'all',
				'elementType': 'labels',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'all',
				'elementType': 'labels.text',
				'stylers': [
					{ 'visibility': 'off' } ]
			},
			{
				'featureType': 'all',
				'elementType': 'labels.text.fill',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'all',
				'elementType': 'labels.text.stroke',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'all',
				'elementType': 'labels.icon',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'administrative',
				'elementType': 'labels.text.fill',
				'stylers': [
					{ 'color': '#444444' }
				]
			},
			{
				'featureType': 'landscape',
				'elementType': 'all',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'poi',
				'elementType': 'all',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'road',
				'elementType': 'all',
				'stylers': [
					{ 'saturation': -100 },
					{ 'lightness': 45 },
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'road.highway',
				'elementType': 'all',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'road.arterial',
				'elementType': 'labels.icon',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'transit',
				'elementType': 'all',
				'stylers': [
					{ 'visibility': 'off' }
				]
			},
			{
				'featureType': 'water',
				'elementType': 'all',
				'stylers': [
					{ 'visibility': 'off' }
				]
			}
		],
		{ name: 'Blanco' });
	return styledMapType;
};
