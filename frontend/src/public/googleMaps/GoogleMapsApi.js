import GoogleTileOverlay from './GoogleTileOverlay';
import arr from '@/common/framework/arr';
import color from '@/common/framework/color';
import FeatureSelector from './FeatureSelector';
import h from '@/public/js/helper';
import { setTimeout } from 'core-js';
import MarkerFactory from './MarkerFactory';
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import IconOverlay from '@/public/overlays/IconOverlay';
import GoogleNullOverlay from './GoogleNullOverlay';
import GoogleMapsAnnotator from './GoogleMapsAnnotator';

export default GoogleMapsApi;
// https://www.endpointdev.com/blog/2019/03/switching-google-maps-leaflet/

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
	this.li = null;
	this.selectedCanvas = null;
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
	this.gMap.setOptions({ styles: styles });
	var lightMapType;
	if (showLabels) {
		var lightMapType = this.CreateLightMap();
	} else {
		lightMapType = this.CreateLightMapNoLabels();
	}
	this.gMap.mapTypes.set('roadLight', lightMapType);
};


GoogleMapsApi.prototype.Write = function(text, location, zIndex, style, innerStyle, ignoreMapMode, type, hidden) {
	if(!style) {
		style = 'mapLabels';
	}
	if (!ignoreMapMode && this.IsSatelliteType()) {
		style += ' sat';
	}
	var loader = require('./overlayLoader');
	var overlay = loader.default.Create(this.gMap, location, text, style, zIndex, innerStyle, type, hidden);
	return overlay;
};

GoogleMapsApi.prototype.Initialize = function () {
	if(window.SegMap === null) {
		throw new Error('segmentedMap is null. Call SetSegmentedMap.');
	}

	var myMapOptions = {

		mapTypeControlOptions: {
			style: this.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
			position: this.google.maps.ControlPosition.TOP_LEFT,
			mapTypeIds: ['roadLight', 'satellite', 'hybrid', 'blank'],
		},
		fullscreenControl: false,
		scaleControl: true,
		gestureHandling: "greedy",
		styles: this.generateLabelsArray(true),
		clickableIcons: false,
		draggableCursor: 'auto',
		minZoom: 3,
		center: { lat: -37.1799565, lng: -65.6866910 },
		zoom: 6
	};

	if (window.Embedded.Active) {
		if (window.Embedded.Readonly) {
			myMapOptions.zoomControl = false;
			myMapOptions.gestureHandling = 'none';
			myMapOptions.disableDefaultUI = true;
		} else {
			myMapOptions.gestureHandling = 'greedy'; //cooperative';
		}
		if (window.Embedded.Compact) {
			myMapOptions.scaleControl = false;
		}
		if (!window.Embedded.Readonly) {
			myMapOptions.fullscreenControl = false;
		}
	}
	// Crea el mapa
	this.gMap = new this.google.maps.Map(document.getElementById('map'), myMapOptions);
	// Agrega tipo de estilo
	var blankMapType = this.CreateBlankMap();
	this.gMap.mapTypes.set('blank', blankMapType);
	// Lo registra
	var lightMapType = this.CreateLightMap();
	this.gMap.mapTypes.set('roadLight', lightMapType);
	// Lo pone por default
	this.gMap.setMapTypeId('roadLight');
	this.AddCopyright();
	this.CreateDrawingManager();
	this.drawingManager.setMap(this.gMap);
	this.SetOpenNewWindowLink();
	//this.gMap.setTilt(45);
	//https://developers.google.com/maps/documentation/javascript/maptypes#Rotating45DegreeImagery

	var loc = this;
	this.google.maps.event.addListenerOnce(this.gMap, 'idle', function () {
		loc.Annotations = new GoogleMapsAnnotator();
		window.SegMap.MapInitialized();
	});
};


GoogleMapsApi.prototype.getZoom = function () {
	return this.gMap.getZoom();
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
	visibility = false;
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
	innerHTML += "Poblaciones © 2019-" + (new Date().getFullYear()) + " CONICET / ODSA - UCA</a>. " +
		"<a class='copyrightText exp-hiddable-unset' href='https://poblaciones.org/terminos/' target='_blank'>Términos y Condiciones</a>. ";
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
		draggable: false,
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

GoogleMapsApi.prototype.CreateMarkerFactory = function (activeSelectedMetric, variable, customIcons) {
	return new MarkerFactory(this, activeSelectedMetric, variable, customIcons);
};

GoogleMapsApi.prototype.FreeMarker = function (marker) {
	marker.setMap(null);
};

GoogleMapsApi.prototype.SetCenter = function (coord, zoom) {
	var c = new this.google.maps.LatLng(coord.Lat, coord.Lon);
	this.gMap.setCenter(c);
	if (zoom) {
		this.SetZoom(zoom);
	}
};

GoogleMapsApi.prototype.calculateOffsetX = function (offsetXpixels) {
	var offsetRad = 0;
	if (offsetXpixels) {
		var ret = this.screenPoint2LatLng({ x: offsetXpixels, y: 0 }, this.gMap);
		var ret2 = this.screenPoint2LatLng({ x: 0, y: 0 }, this.gMap);
		offsetRad = (ret.lng() - ret2.lng()) / 2;
	}
	return offsetRad;
};

GoogleMapsApi.prototype.PanTo = function (coord, offsetXpixels, zoom = null) {
	if (zoom) {
		this.SetZoom(zoom);
	}
	var offsetRad = this.calculateOffsetX(offsetXpixels);
	var c = new this.google.maps.LatLng(coord.Lat, coord.Lon - offsetRad);
	this.gMap.panTo(c);
};

GoogleMapsApi.prototype.screenPoint2LatLng = function (point, map) {
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
	var types = ['roadLight', 'satellite', 'hybrid', 'blank'];
	this.gMap.setOptions({
		mapTypeControlOptions: {
			style: controlType,
			mapTypeIds: types,
		},
	});
};

GoogleMapsApi.prototype.DrawPerimeter = function (pos, radius, fillColor) {
	var strokeOpacity = 0.15;
	var strokeColor = fillColor;
	var center = new this.MapsApi.google.maps.LatLng(pos.Lat, pos.Lon);
	if (color.IsReallyLightColor(fillColor)) {
		strokeOpacity = 1;
		strokeColor = color.ReduceColor(fillColor, .95);
	} else if (color.IsLightColor(fillColor)) {
		strokeOpacity = 1;
	} else if (color.IsAlmostLightColor(fillColor)) {
		strokeOpacity = 0.5;
	}
	return new google.maps.Circle({
            center: center,
            map: this.gMap,
            strokeColor: strokeColor,
            strokeWeight: 1,
            strokeOpacity: strokeOpacity,
            fillColor: fillColor,
						fillOpacity: 0.1,
						clickable: false,
						editable: false,
            radius: radius * 1000
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

GoogleMapsApi.prototype.ClearSelectedFeature = function () {
	if (this.selectedCanvas !== null) {
		this.selectedCanvas.forEach(function (feature) {
			feature.setMap(null);
		});
		this.selectedCanvas = null;
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
		mapType = 'roadLight';
		break;
	case 't':
		mapType = 'streets';
		break;
	case 's':
		mapType = 'satellite';
		break;
	case 'h':
		mapType = 'hybrid';
			break;
	case 'l':
		mapType = 'roadLight';
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
		return 0.10;
	} else if(this.gMap.getMapTypeId() === 'terrain') {
		return 0.10;
	} else if(this.gMap.getMapTypeId() === 'satellite') {
		return 0.4;
	} else if(this.gMap.getMapTypeId() === 'hybrid') {
		return 0.4;
	} else if (this.gMap.getMapTypeId() === 'streets') {
		return 0.10;
	} else if (this.gMap.getMapTypeId() === 'roadLight') {
		return 0.10;
	} else if (this.gMap.getMapTypeId() === 'blank') {
		return 0.4;
	} else { // Default
		return 0.15;
	}
};

GoogleMapsApi.prototype.UpdateClippingStyle = function () {
	this.gMap.data.setStyle({
		strokeWeight: 0.5,
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
		this.AddCanvasToPolygonRings(canvas, featureMask);
	}
	var mask = { type: 'FeatureCollection', features: [featureMask] };

	this.UpdateClippingStyle();
	this.clippingCanvas = this.gMap.data.addGeoJson(mask);
};


GoogleMapsApi.prototype.AddCanvasToPolygonRings = function (canvas, polygonList) {
	if (canvas.features[0].geometry.type === 'MultiPolygon') {
		var polygons = canvas.features[0].geometry.coordinates;
		for (var p = 0; p < polygons.length; p++) {
			for (var i = 0; i < polygons[p].length; i++) {
				polygonList.geometry.coordinates.push(polygons[p][i]);
			}
		}
	} else {
		// polygon
		polygonList.geometry.coordinates = polygonList.geometry.coordinates.concat(
			canvas.features[0].geometry.coordinates);
	}
};

GoogleMapsApi.prototype.SetSelectedFeature = function (feature, key, title) {
	this.ClearSelectedFeature();

	this.selectedCanvas = [];
	if (feature.Canvas) {
		var canvas = feature.Canvas;
		if (canvas.features[0].geometry.type === 'MultiPolygon') {
			for (var polygon of canvas.features[0].geometry.coordinates) {
				this.CreateSelectedPolygon(polygon);
			}
		} else {
			this.CreateSelectedPolygon(canvas.features[0].geometry.coordinates);
		}
	} else {
		// es un punto...
		var isVariableVisible = false;
		if (key && key.MetricId) {
			isVariableVisible = window.SegMap.IsVariableVisible(key.MetricId, key.VariableId);
		}
		// si no, crea un marker
		if (!isVariableVisible) {
			var pos = new this.google.maps.LatLng(feature.Coordinate.Lat, feature.Coordinate.Lon);
			// Create a marker and center map on user location
			var label = null;
			if (title) {
				label = { text: title, className: 'markerSelectedLabel' };
			}
			/*var marker = new this.google.maps.Marker({
				position: pos,
				draggable: false,
				label: label,
				zIndex: 1000 * 1000,
				optimized: false,
				animation: this.google.maps.Animation.DROP,
				map: this.gMap
			});
			this.selectedCanvas.push(marker);*/
		}
		this.CreateSelectedCircle(feature.Coordinate);
	}
};

GoogleMapsApi.prototype.CreateSelectedPolygon = function (polygon) {
	var rings = [];
	for (var ring of polygon) {
		var res = [];
		for (var point of ring) {
			res.push({ lat: point[1], lng: point[0] });
		}
		rings.push(res);
	}
	var item = new this.google.maps.Polygon({
    paths: rings,
   strokeColor: "#fff",
    strokeOpacity: 0.75,
    strokeWeight: 5,
    fillColor: "#ddd",
    fillOpacity: 0,
		clickable: false,
		editable: false,
  });
	item.setMap(this.gMap);
	this.selectedCanvas.push(item);

	item = new this.google.maps.Polygon({
    paths: rings,
		strokeColor: "#ff0000",
    strokeOpacity: 1,
    strokeWeight: 1,
    fillColor: "#ddd",
    fillOpacity: 0.45,
		clickable: false,
		editable: false,
	});

	item.setMap(this.gMap);
	this.selectedCanvas.push(item);
};


GoogleMapsApi.prototype.CreateSelectedCircle = function (center) {
	var radius = 15;

	var item = new google.maps.Circle({
		center: { lat: center.Lat, lng: center.Lon },
		strokeColor: "#FFFFFF",
		strokeWeight: 1,
		strokeOpacity: .8,
		fillColor: "#999",
		fillOpacity: 0.45,
		clickable: false,
		editable: false,
		radius: radius
	});
	item.setMap(this.gMap);
	this.selectedCanvas.push(item);
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
GoogleMapsApi.prototype.EnsureEnvelope = function (envelopeOrig, exactMatch, offsetX) {
// not implemented
};

GoogleMapsApi.prototype.InsertSelectedMetricOverlay = function (activeMetric, index) {
	var deckGlDisabled = (window.Use.UseDeckgl == false);
	if (deckGlDisabled) {
		if (activeMetric.SelectedVersion && activeMetric.SelectedVersion() &&
			activeMetric.SelectedVersion().Work.Id == 130201) {
			deckGlDisabled = false;
		}
	}
	if (activeMetric.useTiles() || deckGlDisabled) {
		this.gMap.overlayMapTypes.insertAt(index,
			new GoogleTileOverlay(activeMetric));
	} else {
		var overlay = new GoogleTileOverlay(activeMetric);
		this.gMap.overlayMapTypes.insertAt(index, overlay);
		var loc = this;
		// Trae los datos
		// -TODO falta:
		// 1. que muestre que los está trayendo
		// 2. que cancele si ya no tiene sentido
		// 3. que lo espere si está exportando
		activeMetric.GetLayerData().then(function (data) {
			if (!overlay.disposed) {
				var iconLayer = new IconOverlay(activeMetric);
				var deckIconLayer = iconLayer.CreateLayer(data, 1);

				const deckOverlay = new GoogleMapsOverlay({
					layers: [deckIconLayer]
				});
				deckOverlay.setMap(loc.gMap);
				overlay.deckOverlay = deckOverlay;
				overlay.ZoomSubscribed = iconLayer;
				window.SegMap.ZoomChangedSubscribers.push(overlay.ZoomSubscribed);
				}
			}
		).catch(function (res) {
			// TODO: revertir el toggle
			loc.RemoveOverlay(index);
			err.errDialog("GetLayerData", "acceder a la información solicitada.", res);
		});
	}
};

GoogleMapsApi.prototype.RemoveOverlay = function (index) {
	var overlay = this.gMap.overlayMapTypes.getAt(index);
	if (overlay.deckOverlay) {
		overlay.deckOverlay.setMap(null);
		arr.Remove(window.SegMap.ZoomChangedSubscribers, overlay.ZoomSubscribed);
	}
	overlay.dispose();
	this.gMap.overlayMapTypes.removeAt(index);
};

GoogleMapsApi.prototype.CreateLightMap = function () {
	var elements = this.CreateLightBase();

	var labels = this.generateLabelsArray(true);

	var styledMapType = new this.google.maps.StyledMapType(
		elements.concat(labels),
		{ name: 'Mapa' });

	return styledMapType;
};

GoogleMapsApi.prototype.CreateLightBase = function () {
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
			"featureType": "landscape.man_made",
			"elementType": "geometry.fill",
			"stylers": [
				{
					"color": "#fafafa"
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
			"elementType": "geometry.fill",
			"stylers": [
				{
					"color": "#eef3ee"
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
			"elementType": "geometry.stroke",
			"stylers": [
				{
					"color": "#dbdbdb"
				}
			]
		},
		{
			"featureType": "road",
			"elementType": "geometry.fill",
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
			"elementType": "geometry.fill",
			"stylers": [
				{
					"color": "#ffffff"
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
					"color": "#c9c9c9"
				}
			]
		},
		{
			"featureType": "water",
			"elementType": "geometry.fill",
			"stylers": [
				{
					"color": "#d4dadc"
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
	return elements;
};

GoogleMapsApi.prototype.CreateLightMapNoLabels = function () {
	var elements = [
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
				{ 'visibility': 'off' }]
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

	];
	var base = this.CreateLightBase();
	elements = base.concat(elements);

	var styledMapType = new this.google.maps.StyledMapType(
		elements,
		{ name: 'Mapa' });

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
/*


GoogleMapsAnnotator.prototype._loadGoogleMapsAPI = function () {
	return new Promise((resolve, reject) => {
		// Skip if already loaded
		if (window.google && window.google.maps) {
			resolve();
			return;
		}

		// Create callback function for the API
		window.initGoogleMapsCallback = () => {
			resolve();
			delete window.initGoogleMapsCallback;
		};

		// Load API script
		const script = document.createElement('script');
		const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing&callback=initGoogleMapsCallback`;
		script.async = true;
		script.defer = true;
		script.onerror = reject;
		document.head.appendChild(script);
	});
};

GoogleMapsAnnotator.prototype._waitForGoogleMapsAPI = async function () {
	// Wait for Google Maps API to be loaded
	if (!window.google || !window.google.maps) {
		await new Promise(resolve => {
			const checkInterval = setInterval(() => {
				if (window.google && window.google.maps) {
					clearInterval(checkInterval);
					resolve();
				}
			}, 100);
		});
	}
}
*/
