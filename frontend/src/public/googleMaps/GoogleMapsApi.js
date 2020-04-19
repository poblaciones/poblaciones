import TxtOverlay from '@/public/googleMaps/TxtOverlay';
import TileOverlay from '@/public/googleMaps/TileOverlay';
import Mercator from '@/public/js/Mercator';
import FeatureSelector from './FeatureSelector';
import h from '@/public/js/helper';

export default GoogleMapsApi;

function GoogleMapsApi(google) {
	this.google = google;
	this.gMap = null;
	this.drawingManager = null;
	this.dragging = false;
	this.myLocationMarket = null;
	this.isSettingZoom = false;
	this.clippingCanvas = null;
	this.segmentedMap = null;
	this.infoWindow = null;
	this.selector = new FeatureSelector(this);
};

GoogleMapsApi.prototype.SetSegmentedMap = function(segmentedMap) {
	this.segmentedMap = segmentedMap;
};
GoogleMapsApi.prototype.BindDataMetric = function (dataMetric) {
	dataMetric.setMap(this.gMap);
};
GoogleMapsApi.prototype.ResetInfoWindow = function (text, coordinate, offset) {
	if(this.infoWindow !== null) {
		this.infoWindow.close();
	}
};

GoogleMapsApi.prototype.ShowInfoWindow = function(text, coordinate, offset) {
	if(offset === undefined) {
		offset = null;
	}
	this.ResetInfoWindow();
	this.infoWindow = new this.google.maps.InfoWindow({
		content: text,
		position: new this.google.maps.LatLng(coordinate.Lat, coordinate.Lon),
		pixelOffset: offset,
		zIndex: 9999999,
	});
	this.infoWindow.open(this.gMap);
};

GoogleMapsApi.prototype.MoveInfoWindow = function(zoom) {
	if(this.infoWindow !== null) {
		this.infoWindow.setOptions({
			pixelOffset: new this.google.maps.Size(0, -1 * h.getScaleFactor(zoom)),
		});
	}
};

GoogleMapsApi.prototype.Write = function(text, location, zIndex, style, innerStyle, ignoreMapMode) {
	if(!style) {
		style = 'mapLabels';
	}
	if (!ignoreMapMode && this.IsSatelliteType()) {
		style += ' mapLabelsSat';
	}
	var overlay = new TxtOverlay(this.gMap, location, text, style, zIndex, innerStyle);
	return overlay;
};

GoogleMapsApi.prototype.Initialize = function () {
	if(this.segmentedMap === null) {
		throw new Error('segmentedMap is null. Call SetSegmentedMap.');
	}

	var myMapOptions = {
		mapTypeControlOptions: {
			style: this.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'blank'],
		},
	 scaleControl: true,
		styles: [{
			featureType: 'poi.attraction',
			elementType: 'labels',
			stylers: [{ visibility: 'off' }]
		}, {
			featureType: 'administrative.locality',
			elementType: 'labels',
			stylers: [{ visibility: 'off' }]
		}, {
			featureType: 'administrative.country',
			elementType: 'labels',
			stylers: [{ visibility: 'off' }]
		}, {
			featureType: 'administrative.province',
			elementType: 'labels',
			stylers: [{ visibility: 'off' }]
		}],
		clickableIcons: false,
		center: { lat: -37.1799565, lng: -65.6866910 },
		zoom: 6
	};
//		controlSize: 25,

	var styledMapType = this.CreateBlankMap();

	this.gMap = new this.google.maps.Map(document.getElementById('map'), myMapOptions);

	this.gMap.mapTypes.set('blank', styledMapType);
	this.AddCopyright();
	this.CreateDrawingManager();
	this.drawingManager.setMap(this.gMap);

	//this.gMap.setTilt(45);
	//https://developers.google.com/maps/documentation/javascript/maptypes#Rotating45DegreeImagery

	var loc = this;
	this.google.maps.event.addListenerOnce(this.gMap, 'idle', function () {
		loc.segmentedMap.MapInitialized();
	});
};

GoogleMapsApi.prototype.BindEvents = function () {
	var loc = this;
	this.gMap.addListener('bounds_changed', function () {
		if (loc.dragging === false) {
			loc.segmentedMap.FrameMoved(loc.getBounds());
			loc.segmentedMap.BoundsChanged();
		}
	});
	this.gMap.addListener('zoom_changed', function () {
		//	if (loc.isSettingZoom === false) {
		loc.segmentedMap.ZoomChanged(loc.gMap.getZoom());
		//}
		loc.MoveInfoWindow(loc.gMap.getZoom());
	});
	this.gMap.addListener('dragstart', function () {
		loc.dragging = true;
	});
	this.gMap.addListener('dragend', function () {
		loc.dragging = false;
		loc.segmentedMap.BoundsChanged();
	});

	this.gMap.addListener('maptypeid_changed', function () {
		loc.segmentedMap.MapTypeChanged(loc.GetMapTypeState());
		loc.UpdateClippingStyle();
	});
	this.google.maps.event.addListener(this.drawingManager, 'circlecomplete', function (circle) {
		loc.CircleCompleted(circle);
	});
};

GoogleMapsApi.prototype.AddCopyright = function () {
	var controlDiv = document.createElement('DIV');
	controlDiv.innerHTML = "<div class='copyrightText'>Poblaciones © 2020 CONICET/ODSA-UCA. " +
		"<a class='copyrightText' href='https://poblaciones.org/terminos/' target='_blank'>Términos y Condiciones</a>. " +
		"<a class='copyrightText' title='Comentarios y sugerencias a Poblaciones' href='https://poblaciones.org/contacto/' target='_blank'><i class='far fa-comments'></i> Contacto</a></div>";
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
	if (this.myLocationMarket !== null) {
		this.myLocationMarket.setMap(null);
		this.myLocationMarket = null;
	}
};


GoogleMapsApi.prototype.CreateMyLocationMarker = function (coord) {
	this.ClearMyLocationMarker();
	var pos = new this.google.maps.LatLng(coord.Lat, coord.Lon);

	// Create a marker and center map on user location
	this.myLocationMarket = new this.google.maps.Marker({
		position: pos,
		draggable: true,
		animation: this.google.maps.Animation.DROP,
		map: this.gMap
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
			Lat: h.trimNumber(center.lat()),
			Lon: h.trimNumber(center.lng()),
		},
		Radius: {
			Lat: h.trimNumber(Math.abs(radius.lat() - center.lat())),
			Lon: h.trimNumber(Math.abs(radius.lng() - center.lng())),
		},
	};
	this.segmentedMap.Clipping.SetClippingCircle(clippingCircle);

	//borra el círculo
	circle.setMap(null);
	this.segmentedMap.SetSelectionMode(0);
};

GoogleMapsApi.prototype.SetCenter = function (coord) {
	var c = new this.google.maps.LatLng(coord.Lat, coord.Lon);
	this.gMap.setCenter(c);
};

GoogleMapsApi.prototype.PanTo = function (coord) {
	var c = new this.google.maps.LatLng(coord.Lat, coord.Lon);
	this.gMap.panTo(c);
};

GoogleMapsApi.prototype.SetZoom = function (zoom) {
	this.isSettingZoom = true;
	this.gMap.setZoom(zoom);
	this.isSettingZoom = false;
};

GoogleMapsApi.prototype.FitEnvelope = function (envelopeOrig) {
	var envelope = h.scaleEnvelope(envelopeOrig, .5);
	var min = new this.google.maps.LatLng(envelope.Min.Lat, envelope.Min.Lon);
	var max = new this.google.maps.LatLng(envelope.Max.Lat, envelope.Max.Lon);
	var bounds = new this.google.maps.LatLngBounds();
	bounds.extend(min);
	bounds.extend(max);
	this.gMap.fitBounds(bounds);
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

GoogleMapsApi.prototype.SetClippingCanvas = function (canvas) {
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
	if (canvas.features[0].geometry.type === 'MultiPolygon') {
		var polygons = canvas.features[0].geometry.coordinates;
		var coords = [zeroItem];
		for (var p = 0; p < polygons.length; p++) {
			for (var i = 0; i < polygons[p].length; i++) {
				coords.push(polygons[p][i]);
			}
		}
		canvas.features[0].geometry.coordinates = coords;
		canvas.features[0].geometry.type = 'Polygon';
	} else {
		canvas.features[0].geometry.coordinates.unshift(zeroItem);
	}
	this.UpdateClippingStyle();
	this.clippingCanvas = this.gMap.data.addGeoJson(canvas);
};

GoogleMapsApi.prototype.markerClicked = function (event, metricVersion, fid, offset) {
	window.SegMap.InfoRequested(h.getPosition(event), metricVersion, fid, offset);
};

GoogleMapsApi.prototype.getBounds = function() {
	var ne = this.gMap.getBounds().getNorthEast();
	var sw = this.gMap.getBounds().getSouthWest();
	return {
		Min: {
			Lat: h.trimNumber(ne.lat()),
			Lon: h.trimNumber(ne.lng()),
		},
		Max: {
			Lat: h.trimNumber(sw.lat()),
			Lon: h.trimNumber(sw.lng()),
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
	this.gMap.overlayMapTypes.getAt(index).clear();
	this.gMap.overlayMapTypes.removeAt(index);
};

GoogleMapsApi.prototype.TileBoundsRequiredString = function (tile) {
	if (this.gMap.getTilt() === 0) {
		return null;
	}
	var m = new Mercator();
	var b2 = m.getTileBounds(tile);
	return b2.Max.lat().toFixed(6) + ',' + b2.Min.lng().toFixed(6) + ';' + b2.Min.lat().toFixed(6) + ',' + b2.Max.lng().toFixed(6);
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
