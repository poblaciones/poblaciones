import TxtOverlay from './TxtOverlay';
import LeafletTileOverlay from './LeafletTileOverlay';
import LeafletNullOverlay from './LeafletNullOverlay';
import color from '@/common/framework/color';
import FeatureSelector from './FeatureSelector';
import err from '@/common/framework/err';
import h from '@/public/js/helper';
import { setTimeout } from 'core-js';
import L from 'leaflet';
import Ldraw from 'leaflet-draw';
import arr from '@/common/framework/arr';
import Mercator from '@/public/js/Mercator';
import MarkerFactory from './MarkerFactory';
import IconOverlay from '@/public/overlays/IconOverlay';
import PolygonOverlay from '@/public/overlays/PolygonOverlay';
import { MapView } from '@deck.gl/core';
import { PolygonLayer } from '../../../node_modules/@deck.gl/layers/dist/index';
import './pegman/Pegman.css';
import LeafletAnnotator from './LeafletAnnotator';


export default LeafletApi;
// https://www.endpointdev.com/blog/2019/03/switching-google-maps-leaflet/

//

// plugin para cargar google como base: https://gitlab.com/IvanSanchez/Leaflet.GridLayer.GoogleMutant/
// otro: https://embed.plnkr.co/plunk/Eo39o0

function LeafletApi() {
	this.map = null;
	this.drawingManager = null;
	this.dragging = false;
	this.draggingDelayed = false;
	this.myLocationMarker = null;
	this.baseLayers = {};
	this.isSettingZoom = false;
	this.clippingCanvas = null;
	this.selectedCanvas = null;
	this.currentBaseLayer = null;
	this.baseMapGroup = null;
	this.showLabels = true;
	this.MIN_ZOOM_LABELS = 15;
	this.mapTypeState = 'r';
	this.overlayMapTypesGroup = null;
	this.overlayMapTypesLayers = [];
	this.selector = new FeatureSelector(this);
	this.allwaysHiddenElements = ['landscape.natural', 'landscape.natural.landcover', 'landscape.natural.terrain',
																	'poi.attraction', 'administrative.locality',
																	'administrative.country', 'administrative.province'];
	this.mapabelElements = ['administrative.land_parcel', 'administrative.neighborhood', 'landscape.man_made',
													'poi.business', 'poi.government', 'poi.medical', 'poi.park', 'poi.place_of_worship',
													'poi.school', 'poi.sports_complex', 'transit', 'water' ];
	this.allwaysVisibleElements = ['road'];
	this.setColorElements = ['poi.medical', 'poi.business'];
	this.mapTypeButtons = {};
};

LeafletApi.prototype.UpdateLabelsVisibility = function (showLabels) {
	this.showLabels = showLabels;
	this.CheckBaseLayer();
};


LeafletApi.prototype.Write = function(text, location, zIndex, style, innerStyle, ignoreMapMode, type, hidden) {
	if(!style) {
		style = 'mapLabels';
	}
	if (!ignoreMapMode && this.IsSatelliteType()) {
		style += ' sat';
	}
	var overlay = new TxtOverlay(this.map, location, text, style, zIndex, innerStyle, type, hidden);
	return overlay;
};

LeafletApi.prototype.Initialize = function () {
	if(window.SegMap === null) {
		throw new Error('segmentedMap is null. Call SetSegmentedMap.');
	}

	this.CreateBaseLayers();

	var options = {
		zoomControl: false, zoomAnimation: false,
		renderer: L.canvas(), /*zoomSnap: 0.5,*/ minZoom: 3, maxZoom: 17
	};

	// Crea el mapa
	this.map = new L.Map("map", options);
	// le agrega el control de zoom
	new L.Control.Zoom({ position: 'bottomright' }).addTo(this.map);

	/*
	// agrega streetview
	const p = require('./pegman/Pegman');
	var pegman = new p.default();
	L.Control.Pegman = pegman.Create();
	L.control.pegman = function (options) {
		return new L.Control.Pegman(options);
	};
	var pegmanControl = new L.Control.Pegman({
		position: 'bottomright', // position of control inside the map
		theme: "leaflet-pegman-v3-default", // or "leaflet-pegman-v3-default"
		apiKey: window.SegMap.Configuration.MapsAccess // CHANGE: with your google maps api key
	});
	pegmanControl.addTo(this.map);
	//
	if (!window.Embedded.Active || !window.Embedded.Compact) {
		L.control.scale({ imperial: false }).addTo(this.map);
	}
	*/

	this.CreateDrawingManager();

	this.baseMapGroup = L.layerGroup();
	this.baseMapGroup.addTo(this.map);

	this.overlayMapTypesGroup = L.layerGroup();
	this.overlayMapTypesGroup.addTo(this.map);

	var loc = this;
	this.map.on("load", function () {
		var annotator = new LeafletAnnotator(loc);
		loc.Annotations = annotator;
		loc.mapElements = [];

		// Cuando se complete un dibujo, guardar el elemento
		annotator.onCompleteDrawing(function (element) {
			console.log('Nuevo elemento creado:', element);
			loc.mapElements.push(element);
			loc.Annotations.removeTempElement();
			var activeAnnotation = window.SegMap.GetAnnotationById(element.AnnotationId);
			if (activeAnnotation == null) {
				window.SegMap.CreateAnnotationForType(element.Type).then(function (annotation) {
					activeAnnotation = window.SegMap.CreateActiveAnnotation(annotation);
					activeAnnotation.UpdateItem(element);
				});
			} else {
				activeAnnotation.UpdateItem(element);
			}
		});

		// Manejar la actualización de elementos cuando se editan
		annotator.onElementDragEnd(function (updatedElement) {
			// Encontrar y actualizar el elemento en nuestro array
			const index = loc.mapElements.findIndex(el => el.id === updatedElement.id);
			if (index !== -1) {
				loc.mapElements[index] = updatedElement;

				// Guardar los cambios
				window.SegMap.Annotations.UpdateItem(updateElement);
			}
		});

		// Manejar clics en elementos para seleccionarlos
		annotator.onElementClick(function (elementId, event) {
			// Puedes mostrar propiedades del elemento en un panel lateral
			const element = loc.mapElements.find(el => el.id === elementId);
			if (element) {
				loc.showElementDetails(element);
			}

			// También seleccionar el elemento
			annotator.clearSelection();
			annotator.selectElement(elementId);
		});

		////////////////
		////////////////
		//////////////////
		window.SegMap.MapInitialized();

		var t = document.createElement("div");
		t.innerHTML = '<div class="gmnoprint" role="menubar" style="margin: 10px -10px; z-index: 900; position: absolute; cursor: pointer; left: 0px; top: 0px;">' +
			'<div class="gm-style-mtc" style="float: left; position: relative;">' +
			'<button title="Mostrar mapa de calles" type="button" class="leafletMapButton" style="font-weight: bold" id="roadTypeButton">Mapa</button>' +
			'<button title="Mostrar imágenes satelitales" type="button" class="leafletMapButton" id="satelliteTypeButton">Satélite</button>' +
			'<button title="Mapa vacío" type="button" class="leafletMapButton" id="blankTypeButton">Blanco</button>' +
			'</div></div>';
		var map = document.getElementById('map');
		map.parentElement.appendChild(t);

		loc.mapTypeButtons['r'] = document.getElementById('roadTypeButton');
		loc.mapTypeButtons['r'].addEventListener("click", function () {
			loc.InteractiveChangeMapType("r");
		});
		loc.mapTypeButtons['s'] = document.getElementById('satelliteTypeButton');
		loc.mapTypeButtons['s'].addEventListener("click", function () {
			if (loc.showLabels) {
				loc.InteractiveChangeMapType("h");
			} else {
				loc.InteractiveChangeMapType("s");
			}
		});
		loc.mapTypeButtons['b'] = document.getElementById('blankTypeButton');
		loc.mapTypeButtons['b'].addEventListener("click", function () {
			loc.InteractiveChangeMapType("b");
		});
		loc.BoundsChanged();
	});

	// Agrega la escala
	var scale = L.control.scale({ position: 'bottomright', maxWidth: 120, imperial: false });
	scale.addTo(this.map);


	this.map.setView(new L.LatLng(-37.1799565, -65.6866910), 6);
	this.CheckBaseLayer();
};

// Mostrar detalles de un elemento en un panel lateral
LeafletApi.prototype.showElementDetails = function (element) {
	const detailsPanel = document.getElementById('element-details');
	detailsPanel.innerHTML = `
    <h3>${element.nombre || 'Sin nombre'}</h3>
    <p>${element.descripcion || 'Sin descripción'}</p>
    <div class="color-sample" style="background-color: ${element.color}"></div>
    <p>Lista: ${element.lista || 'Ninguna'}</p>
    <button id="btn-delete-element">Eliminar</button>
    <button id="btn-edit-properties">Editar propiedades</button>
  `;

	// Configurar botones de acciones
	document.getElementById('btn-delete-element').addEventListener('click', function () {
		deleteElement(element.id);
	});

	document.getElementById('btn-edit-properties').addEventListener('click', function () {
		showEditPropertiesPopup(element);
	});
};

// Eliminar un elemento
LeafletApi.prototype.deleteElement = function (elementId) {
	// Eliminar del mapa
	this.Annotations.removeElement(elementId);

	// Eliminar de nuestra colección
	this.mapElements = this.mapElements.filter(el => el.id !== elementId);
	window.SegMap.Annotations.DeleteItem(elementId);

	// Limpiar panel de detalles
	document.getElementById('element-details').innerHTML = '';
};

// Mostrar popup para editar propiedades
LeafletApi.prototype.showEditPropertiesPopup = function (element) {
	// Crear un popup con un formulario similar al que usa el anotador internamente
	// pero esta vez para editar un elemento existente
	var loc = this;
	window.Popups.AnnotationItem.show(element).then(
		function (element) {

			loc.Annotations.updateElement(element);
			// Actualizar en nuestra colección
			const index = loc.mapElements.findIndex(el => el.id === element.id);
			if (index !== -1) {
				loc.mapElements[index] = element;
				window.SegMap.Annotations.UpdateItem(element);
			}
		});

};

LeafletApi.prototype.InteractiveChangeMapType = function (type) {
	window.SegMap.SetMapTypeState(type);
	window.SegMap.MapTypeChanged(type);
	window.SegMap.SaveRoute.UpdateRoute();
	this.UpdateClippingStyle();
};

LeafletApi.prototype.CreateBaseLayers = function () {
	var cp = this.GetCopyright();
	// Estandar:
	// src1= https://tile.openstreetmap.org/{z}/{x}/{y}.png;
	// Humanitarian
	// src2= https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png;
	// No Labels
	// src3 = https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png

	// https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png
	// carto basemaps:
	//
	// satelite:
	// https://github.com/roblabs/xyz-raster-sources


	// desde 16, que tenga dires
	this.baseLayers['roadmap'] = new L.TileLayer("https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png", { attribution: cp });
	this.baseLayers['roadmap_no_labels'] = new L.TileLayer("https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png", { attribution: cp });
	this.baseLayers['roadmap_only_labels'] = new L.TileLayer("https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png", { attribution: cp });

	var zeroItem = [[0, 90], [180, 90], [180, -90], [0, -90], [-180, -90], [-180, 0], [-180, 90], [0, 90]];
	var featureMask = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }};
	featureMask.geometry.coordinates.push(zeroItem);
	var mask = { type: 'FeatureCollection', features: [featureMask] };
	var blank = L.geoJson(mask, { attribution: cp, interactive: false } );
	blank.setStyle({
        "color": "#e5e3df",
				"weight": 1,
        "fillOpacity": this.getOpacity()
    });
	this.baseLayers['blank'] = blank;
	// satélite
	var mapLink =  '<a href="http://www.esri.com/">Esri</a>';
  var wholink =  'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
  var satellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: cp,
            maxZoom: 18,
		});
	this.baseLayers['satellite'] = satellite;

	for (var layer in this.baseLayers) {
		this.baseLayers[layer].setZIndex(0);
	}
};

LeafletApi.prototype.generateLabelsArray = function (visibility) {
	var ret = [];
	// https://mapstyle.withgoogle.com/
	for (var ele in this.mapabelElements) {
		var item = this.mapabelElements[ele];
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

LeafletApi.prototype.CheckBaseLayer = function () {
	var reqLayer;
	if (this.mapTypeState === 'b') {
		reqLayer = 'blank';
	} else if (this.mapTypeState === 's') {
			reqLayer = 'satellite';
	} else if (this.mapTypeState === 'h') {
		if (this.map.getZoom() >= this.MIN_ZOOM_LABELS && this.showLabels) {
			reqLayer = 'satellite,roadmap_only_labels'; // se podría agregar roadmap_only_labels
		} else {
			reqLayer = 'satellite'; // se podría agregar roadmap_only_labels
		}
	} else if (this.mapTypeState === 'r') {
		if (this.map.getZoom() >= this.MIN_ZOOM_LABELS && this.showLabels) {
			reqLayer = 'roadmap';
		} else {
			reqLayer = 'roadmap_no_labels';
		}
	} else {
		reqLayer = 'roadmap_no_labels';
	}
	this.SetBaseMap(reqLayer);
	// actualiza el negrita del botón
	if (this.mapTypeButtons.r) {
		for (var button in this.mapTypeButtons) {
			this.setBold(this.mapTypeButtons[button], false);
		}
		this.setBold(this.mapTypeButtons[(this.mapTypeState == 'h' ? 's' : this.mapTypeState)], true);
	}
};

LeafletApi.prototype.setBold = function (ele, state) {
	ele.style.fontWeight = (state ? "bold" : '');
};

LeafletApi.prototype.SetBaseMap = function (basemapName) {
	if (this.currentBaseLayer === basemapName) {
		return;
	}
	this.baseMapGroup.clearLayers();
	if (basemapName.indexOf(",") > 0) {
		for (var name of basemapName.split(',')) {
			this.baseMapGroup.addLayer(this.baseLayers[name]);
		}
	} else {
		this.baseMapGroup.addLayer(this.baseLayers[basemapName]);
	}
	this.currentBaseLayer = basemapName;
};

LeafletApi.prototype.BindEvents = function () {
	var loc = this;

	this.map.on("zoomend", function() {
		window.SegMap.ZoomChanged(loc.map.getZoom());
		loc.CheckBaseLayer();
		loc.BoundsChanged();
	});

	this.map.on("movestart", function() {
		loc.dragging = true;
		loc.draggingDelayed = true;
	});

	this.map.on("moveend", function() {
		loc.dragging = false;
		window.SegMap.BoundsChanged();
		setTimeout(() => {
			loc.draggingDelayed = false;
		}, 250);
//		event.stopPropagation();
		loc.BoundsChanged();
	});

	this.map.on(L.Draw.Event.CREATED, function (circle) {
		var type = circle.layerType;
			if (type === 'circle') {
				loc.CircleCompleted(circle);
			}
	});
	this.map.on("draw:drawstop", function() {
		window.SegMap.SetSelectionMode("PAN");
	});
};

LeafletApi.prototype.BoundsChanged = function () {
	if (this.dragging === false) {
		window.SegMap.FrameMoved(this.getBounds());
		window.SegMap.BoundsChanged();
	}
};

LeafletApi.prototype.GetCopyright = function () {
	var div = "<span class='copyright' style='padding: 0px'>";
	var innerHTML = "<span class='copyrightText'>";
	if (window.Embedded.Active) {
		innerHTML += "<a class='copyrightText' href='https://poblaciones.org/' target='_blank'>";
	}
	innerHTML += "Poblaciones © 2019-" + (new Date().getFullYear()) + " CONICET / ODSA - UCA</a>. " +
		"<a class='copyrightText exp-hiddable-unset' href='https://poblaciones.org/terminos/' target='_blank'>Términos y Condiciones</a>. ";
	if (!window.Embedded.Active) {
		innerHTML += "<a class='copyrightText exp-hiddable-unset' title='Comentarios y sugerencias a Poblaciones' href='https://poblaciones.org/contacto/' target='_blank'><i class='far fa-comments contacto'></i> Contacto</a>";
	}
	innerHTML += "</span>";
	return div + innerHTML + "</span>";
};

LeafletApi.prototype.StopDrawing = function () {
	this.drawingManager.disable();
};

LeafletApi.prototype.BeginDrawingCircle = function () {
	this.drawingManager.enable();
};

LeafletApi.prototype.TriggerResize = function () {
	this.map.invalidateSize();
};

LeafletApi.prototype.ClearMyLocationMarker = function () {
	if (this.myLocationMarker !== null) {
		this.map.removeLayer(this.myLocationMarker);
		this.myLocationMarker = null;
	}
};

LeafletApi.prototype.CreateMyLocationMarker = function (coord) {
	this.ClearMyLocationMarker();
	var pos = L.latLng(coord.Lat, coord.Lon);
	var content = 'Lat: ' + coord.Lat.toFixed(6) + ", " + 'Lon: ' + coord.Lon.toFixed(6);

	var icon = this.defaultMarkerIcon();

	this.myLocationMarker = new L.marker(pos, { icon: icon });
	this.myLocationMarker.addTo(this.map);

	this.myLocationMarker.bindPopup(content);

};


LeafletApi.prototype.CreateDrawingManager = function () {
	// esto puede permitir hacerlo en dos clicks
	// https://github.com/ThomasG77/leaflet.pm/tree/hook-circle-move
	this.drawingManager = new L.Draw.Circle(this.map,
		{
			shapeOptions: {
				fillColor: "#aaa",
				fillOpacity: this.getOpacity(),
				weight: 1,
				color: '#111',
			},
			showRadius: false
		});
	if (this.drawingManager._initialLabelText) {
		this.drawingManager._initialLabelText = '';
	}
	if (this.drawingManager._endLabelText) {
		this.drawingManager._endLabelText = '';
	}
};

LeafletApi.prototype.CircleCompleted = function (circle) {
	circle = circle.layer;

	this.StopDrawing();

	var radiusMeters = circle.getRadius();
	var center = circle.getLatLng();
	var m = new Mercator();
	var radiusLon = m.metersToDegreesLongitude(center.lat, radiusMeters);
	var radiusLat = m.metersToDegreesLatitude(radiusMeters);

	var clippingCircle = {
		Center: {
			Lat: h.trimNumberCoords(center.lat),
			Lon: h.trimNumberCoords(center.lng),
		},
		Radius: {
			Lat: h.trimNumberCoords(radiusLat),
			Lon: h.trimNumberCoords(radiusLon),
		},
	};
	window.SegMap.Clipping.SetClippingCircle(clippingCircle);

	//borra el círculo
	this.map.removeLayer(circle);
	window.SegMap.SetSelectionMode("PAN");
};

LeafletApi.prototype.CreateMarkerFactory = function (activeSelectedMetric, variable, customIcons) {
	return new MarkerFactory(this, activeSelectedMetric, variable, customIcons);
};

LeafletApi.prototype.FreeMarker = function (marker) {
	this.map.removeLayer(marker);
};

LeafletApi.prototype.SetCenter = function (coord, zoom) {
	var c = L.latLng(coord.Lat, coord.Lon);
	this.map.setView(c, (zoom ? zoom : undefined));
};

LeafletApi.prototype.calculateOffsetX = function (offsetXpixels, zoom = null) {
	var offsetRad = 0;
	if (offsetXpixels) {
		var ret = this.screenPoint2LatLng({ x: offsetXpixels, y: 0 }, this.map, zoom);
		var ret2 = this.screenPoint2LatLng({ x: 0, y: 0 }, this.map, zoom);
		offsetRad = (ret.Lon - ret2.Lon) / 2;
	}
	return offsetRad;
};

LeafletApi.prototype.PanTo = function (coord, offsetXpixels, zoom) {
	var offsetRad = this.calculateOffsetX(offsetXpixels, zoom);
	var c = L.latLng(coord.Lat, coord.Lon - offsetRad);
	this.map.flyTo(c, (zoom ? zoom : undefined));
};

LeafletApi.prototype.screenPoint2LatLng = function (point, map, zoom = null) {
	var m = new Mercator();
	var topRight = m.fromLatLngToPoint(map.getBounds().getNorthEast());
	var bottomLeft = m.fromLatLngToPoint(map.getBounds().getSouthWest());
	if (zoom === null || zoom === undefined) {
		zoom = map.getZoom();
	}
	var scale = Math.pow(2, zoom);
	var worldPoint = { x: point.x / scale + bottomLeft.x, y: point.y / scale + topRight.y };

	return m.fromPointToLatLng(worldPoint);
};

LeafletApi.prototype.SetTypeControlsDropDown = function () {
	// TODO leaflet
//	this.SetTypeControls(this.google.maps.MapTypeControlStyle.DROPDOWN_MENU);
};

LeafletApi.prototype.SetTypeControlsDefault = function () {
	// TODO leaflet
	//this.SetTypeControls(this.google.maps.MapTypeControlStyle.HORIZONTAL_BAR);
};

LeafletApi.prototype.DrawPerimeter = function (center, radius, fillColor) {
	var strokeOpacity = 0.15;
	var strokeColor = fillColor;
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
            map: this.map,
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

LeafletApi.prototype.SetZoom = function (zoom) {
	this.isSettingZoom = true;
	this.map.setZoom(zoom);
	this.isSettingZoom = false;
};

LeafletApi.prototype.EnsureEnvelope = function (envelopeOrig, exactMatch, offsetX) {
	var envelope;
//	envelope = envelopeOrig;
	envelope = h.scaleEnvelope(envelopeOrig, 1.25);

	var offsetRad = 0;
	if (offsetX) {
		offsetRad = this.calculateOffsetX(offsetX);
	}
	var min = L.latLng(envelope.Min.Lat, envelope.Min.Lon);
	var max = L.latLng(envelope.Max.Lat, envelope.Max.Lon);
	var bounds = L.latLngBounds();
	bounds.extend(min);
	bounds.extend(max);
	var current = this.map.getBounds();
	if (current.getEast() < max.lng ||
		current.getWest() + offsetRad > min.lng ||
		current.getNorth() < max.lat ||
		current.getSouth() > min.lat) {
		this.map.flyToBounds(bounds, {
			animate: true,
			duration: 1 // Duración en segundos (puedes ajustarlo)
		});
		if (offsetX) {
			var pos = L.latLng((envelope.Min.Lat + envelope.Max.Lat) / 2, (envelope.Min.Lon + envelope.Max.Lon) / 2);
			this.map.flyTo(L.latLng(pos.lat, pos.lng - offsetRad));
		}
	}
};


LeafletApi.prototype.FitEnvelope = function (envelopeOrig, exactMatch, offsetX) {
	var envelope;
	envelope = envelopeOrig;
	if (exactMatch) {
		envelope = envelopeOrig;
	} else {
		envelope = h.scaleEnvelope(envelopeOrig, 1.25);
	}
	var min = L.latLng(envelope.Min.Lat, envelope.Min.Lon);
	var max = L.latLng(envelope.Max.Lat, envelope.Max.Lon);
	var bounds = L.latLngBounds();
	bounds.extend(min);
	bounds.extend(max);
	this.map.flyToBounds(bounds, {
		animate: true,
		duration: 1 // Duración en segundos (puedes ajustarlo)
	});

	var offsetRad = 0;
	if (offsetX) {
		offsetRad = this.calculateOffsetX(offsetX);
		min = L.latLng(envelope.Min.Lat, envelope.Min.Lon);
		max = L.latLng(envelope.Max.Lat, envelope.Max.Lon + offsetRad);
		var bounds = L.latLngBounds();
		bounds.extend(min);
		bounds.extend(max);
		offsetRad = this.calculateOffsetX(offsetX);
		var pos = L.latLng((envelope.Min.Lat + envelope.Max.Lat) / 2, (envelope.Min.Lon + envelope.Max.Lon) / 2);
		this.map.flyTo(L.latLng(pos.lat, pos.lng - offsetRad));
	}
};

LeafletApi.prototype.ClearClippingCanvas = function () {
	if (this.clippingCanvas !== null) {
		this.map.removeLayer(this.clippingCanvas);
		this.clippingCanvas = null;
	}
};

LeafletApi.prototype.ClearSelectedFeature = function () {
	var loc = this;
	if (this.selectedCanvas !== null) {
		this.selectedCanvas.forEach(function (feature) {
			loc.map.removeLayer(feature);
		});
		this.selectedCanvas = null;
	}
};


LeafletApi.prototype.GetMapTypeState = function () {
	if (!this.map) {
		return '';
	}
	return this.mapTypeState;
};

LeafletApi.prototype.IsSatelliteType = function () {
	if (!this.map) {
		return false;
	}
	return this.mapTypeState === 's' || this.mapTypeState === 'h';
};

LeafletApi.prototype.SetMapTypeState = function (mapTypeState) {
	this.mapTypeState = mapTypeState;
	this.CheckBaseLayer();
};

LeafletApi.prototype.getOpacity = function () {
	if (this.mapTypeState === 'b') {
		return 1.5 * 0.4;
	} else if (this.mapTypeState === 'r') {
		return 1.5 * 0.15;
	} else if (this.mapTypeState === 's' || this.mapTypeState === 'h') {
		return 1.5 * 0.4;
	} else { // Default
		return 0.15;
	}
};

LeafletApi.prototype.UpdateClippingStyle = function () {
	if (this.clippingCanvas) {
		this.clippingCanvas.setStyle({
        "color": "#444",
				"weight": 0.5,
        "fillOpacity": this.getOpacity()
		});
	}
};

LeafletApi.prototype.SetClippingCanvas = function (canvasList) {
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

	this.clippingCanvas = L.geoJson(mask, { interactive: false } );
	this.UpdateClippingStyle();
	this.clippingCanvas.addTo(this.map);
};


LeafletApi.prototype.SetSelectedFeature = function (feature, key, title) {
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
			var pos = new L.latLng(feature.Coordinate.Lat, feature.Coordinate.Lon);
			// Create a marker and center map on user location
			var label = null;
			if (title) {
				label = { text: title, className: 'markerSelectedLabel' };
			}
			/*
			var icon = this.defaultMarkerIcon();

			var marker = new L.marker(pos, { icon: icon });
			marker.addTo(this.map);

			// label: label
			this.selectedCanvas.push(marker); */
		}
		this.CreateSelectedCircle(feature.Coordinate);
	}
};

LeafletApi.prototype.defaultMarkerIcon = function () {
	var svg = 'm11.666664,-0.42c-6.06933,0 -10.989998,4.920668 -10.989998,10.989998c0,9.564597 10.989998,12.987835 10.989998,22.46524c0,-9.477405 10.989998,-13.40105 10.989998,-22.46524c0,-6.06933 -4.920668,-10.989998 -10.989998,-10.989998z';
	var iconUrl = 'data:image/svg+xml;base64,' + btoa(svg);

	var icon = L.icon({
		iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAFgUlEQVR4Aa1XA5BjWRTN2oW17d3YaZtr2962HUzbDNpjszW24mRt28p47v7zq/bXZtrp/lWnXr337j3nPCe85NcypgSFdugCpW5YoDAMRaIMqRi6aKq5E3YqDQO3qAwjVWrD8Ncq/RBpykd8oZUb/kaJutow8r1aP9II0WmLKLIsJyv1w/kqw9Ch2MYdB++12Onxee/QMwvf4/Dk/Lfp/i4nxTXtOoQ4pW5Aj7wpici1A9erdAN2OH64x8OSP9j3Ft3b7aWkTg/Fm91siTra0f9on5sQr9INejH6CUUUpavjFNq1B+Oadhxmnfa8RfEmN8VNAsQhPqF55xHkMzz3jSmChWU6f7/XZKNH+9+hBLOHYozuKQPxyMPUKkrX/K0uWnfFaJGS1QPRtZsOPtr3NsW0uyh6NNCOkU3Yz+bXbT3I8G3xE5EXLXtCXbbqwCO9zPQYPRTZ5vIDXD7U+w7rFDEoUUf7ibHIR4y6bLVPXrz8JVZEql13trxwue/uDivd3fkWRbS6/IA2bID4uk0UpF1N8qLlbBlXs4Ee7HLTfV1j54APvODnSfOWBqtKVvjgLKzF5YdEk5ewRkGlK0i33Eofffc7HT56jD7/6U+qH3Cx7SBLNntH5YIPvODnyfIXZYRVDPqgHtLs5ABHD3YzLuespb7t79FY34DjMwrVrcTuwlT55YMPvOBnRrJ4VXTdNnYug5ucHLBjEpt30701A3Ts+HEa73u6dT3FNWwflY86eMHPk+Yu+i6pzUpRrW7SNDg5JHR4KapmM5Wv2E8Tfcb1HoqqHMHU+uWDD7zg54mz5/2BSnizi9T1Dg4QQXLToGNCkb6tb1NU+QAlGr1++eADrzhn/u8Q2YZhQVlZ5+CAOtqfbhmaUCS1ezNFVm2imDbPmPng5wmz+gwh+oHDce0eUtQ6OGDIyR0uUhUsoO3vfDmmgOezH0mZN59x7MBi++WDL1g/eEiU3avlidO671bkLfwbw5XV2P8Pzo0ydy4t2/0eu33xYSOMOD8hTf4CrBtGMSoXfPLchX+J0ruSePw3LZeK0juPJbYzrhkH0io7B3k164hiGvawhOKMLkrQLyVpZg8rHFW7E2uHOL888IBPlNZ1FPzstSJM694fWr6RwpvcJK60+0HCILTBzZLFNdtAzJaohze60T8qBzyh5ZuOg5e7uwQppofEmf2++DYvmySqGBuKaicF1blQjhuHdvCIMvp8whTTfZzI7RldpwtSzL+F1+wkdZ2TBOW2gIF88PBTzD/gpeREAMEbxnJcaJHNHrpzji0gQCS6hdkEeYt9DF/2qPcEC8RM28Hwmr3sdNyht00byAut2k3gufWNtgtOEOFGUwcXWNDbdNbpgBGxEvKkOQsxivJx33iow0Vw5S6SVTrpVq11ysA2Rp7gTfPfktc6zhtXBBC+adRLshf6sG2RfHPZ5EAc4sVZ83yCN00Fk/4kggu40ZTvIEm5g24qtU4KjBrx/BTTH8ifVASAG7gKrnWxJDcU7x8X6Ecczhm3o6YicvsLXWfh3Ch1W0k8x0nXF+0fFxgt4phz8QvypiwCCFKMqXCnqXExjq10beH+UUA7+nG6mdG/Pu0f3LgFcGrl2s0kNNjpmoJ9o4B29CMO8dMT4Q5ox8uitF6fqsrJOr8qnwNbRzv6hSnG5wP+64C7h9lp30hKNtKdWjtdkbuPA19nJ7Tz3zR/ibgARbhb4AlhavcBebmTHcFl2fvYEnW0ox9xMxKBS8btJ+KiEbq9zA4RthQXDhPa0T9TEe69gWupwc6uBUphquXgf+/FrIjweHQS4/pduMe5ERUMHUd9xv8ZR98CxkS4F2n3EUrUZ10EYNw7BWm9x1GiPssi3GgiGRDKWRYZfXlON+dfNbM+GgIwYdwAAAAASUVORK5CYII='
		, popupAnchor: [20, 0]
	});
	return icon;
};

LeafletApi.prototype.CreateSelectedPolygon = function (polygon) {
	var rings = [];
	for (var ring of polygon) {
		var res = [];
		for (var point of ring) {
			res.push([ point[1], point[0] ]);
		}
		rings.push(res);
	}

	var item = L.polygon(rings,
		{
			fillColor: "#ddd",
			fillOpacity: 0,
			opacity: 0.75,
			weight: 5,
			color: '#fff',
			interactive: false
		});
	item.addTo(this.map);
	this.selectedCanvas.push(item);

	item = L.polygon(rings,
		{
			fillColor: "#ddd",
			fillOpacity: 0.45,
			opacity: 1,
			weight: 1,
			color: '#ff0000',
			interactive: false
		});
	item.addTo(this.map);
	this.selectedCanvas.push(item);
};

LeafletApi.prototype.CreateSelectedCircle = function (center) {
	var radius = 15;

	var item = new L.circle([ center.Lat, center.Lon ],radius,
		{
		color: "#FFFFFF",
		weight: 1,
		opacity: .8,
		fillColor: "#999",
		fillOpacity: 0.45,
		interactive: false
		});
	item.addTo(this.map);
	this.selectedCanvas.push(item);
};

LeafletApi.prototype.markerClicked = function (event, metricVersion, fid) {
	if (this.draggingDelayed) {
		return;
	}
	window.SegMap.InfoWindow.InfoRequestedInteractive(h.getPosition(event), metricVersion, fid);
};

LeafletApi.prototype.getBounds = function() {
	var ne = this.map.getBounds().getNorthEast();
	var sw = this.map.getBounds().getSouthWest();
	return {
		Min: {
			Lat: h.trimNumberCoords(ne.lat),
			Lon: h.trimNumberCoords(ne.lng),
		},
		Max: {
			Lat: h.trimNumberCoords(sw.lat),
			Lon: h.trimNumberCoords(sw.lng),
		},
		Zoom: this.map.getZoom(),
	};
};

LeafletApi.prototype.getZoom = function () {
	return this.map.getZoom();
};
LeafletApi.prototype.CreateDeckglLayer = function (activeMetric, data, index) {
	// Lo crea
	var overlayTiled = new LeafletTileOverlay(activeMetric);
	const d = require('./deck-gl/LeafletLayer');
	var deckElementsLayer;
	// Crea la capa
	if (activeMetric.IsLocationType()) {
		var iconLayer = new IconOverlay(activeMetric);
		deckElementsLayer = iconLayer.CreateLayer(data, 1);
	} else {
		var polygonLayer = new PolygonOverlay(activeMetric);
		deckElementsLayer = polygonLayer.CreateLayer(data);
	}
	// La agrega
	var wrapper = new d.default({
		views: [
			new MapView({
				repeat: true
			})
		],
		layers: [deckElementsLayer]
	});

	var overlay = L.layerGroup([wrapper, overlayTiled]);
	overlay.dispose = function () {
		overlay.eachLayer(function (layer) {
			layer.dispose();
		});
	};

	this.RemoveOverlay(index);
	this.doInsertOverlay(index, overlay);
};


LeafletApi.prototype.InsertSelectedMetricOverlay = function (activeMetric, index) {
	var deckGlDisabled = (window.Use.UseDeckgl == false);
	if (deckGlDisabled) {
		if (activeMetric.SelectedVersion && activeMetric.SelectedVersion() &&
			activeMetric.SelectedVersion().Work.Id == 130201) {
			deckGlDisabled = false;
		}
	}
	var overlay;
	if (activeMetric.useTiles() || deckGlDisabled) {
		// Lo crea
		overlay = new LeafletTileOverlay(activeMetric);
		// Lo agrega
		this.doInsertOverlay(index, overlay);
	} else {
		// Lo crea
		overlay = new LeafletNullOverlay();
		// Lo agrega
		this.doInsertOverlay(index, overlay);

		var loc = this;
		// Trae los datos

		// -TODO falta:
		// 1. que muestre que los está trayendo
		// 2. que cancele si ya no tiene sentido
		// 3. que lo espere si está exportando
		activeMetric.GetLayerData().then(function (data) {
			if (!overlay.disposed) {
				loc.CreateDeckglLayer(activeMetric, data, index);
			}
		}).catch(function (res) {
			// TODO: revertir el toggle
			loc.RemoveOverlay(index);
			err.errDialog("GetLayerData", "acceder a la información solicitada.", res);
		});;
	}
};

LeafletApi.prototype.doInsertOverlay = function (index, overlay) {
	// le aumenta el índice a los siguientes...
	for (var layer of this.overlayMapTypesLayers) {
		if (layer.index >= index) {
			layer.index++;
		}
	}
	// Lo ponen en el listado interno
	this.overlayMapTypesLayers.push(overlay);
	// Se lo setea
	if (index >= this.overlayMapTypesLayers.length) {
		overlay.index = this.overlayMapTypesLayers.length - 1;
	} else {
		overlay.index = index;
	}
	// Lo agrega al mapa
	this.overlayMapTypesGroup.addLayer(overlay);
	// actualiza las posiciones
	for (var layer of this.overlayMapTypesLayers) {
		if (layer.setZIndex) {
			layer.setZIndex(layer.index);
		}
	}
};

LeafletApi.prototype.RemoveOverlay = function (index) {
	for (var layer of this.overlayMapTypesLayers) {
		if (layer.index === index) {
			// lo remueve
			this.overlayMapTypesGroup.removeLayer(layer);
			arr.Remove(this.overlayMapTypesLayers, layer);
			// libera
			layer.dispose();
			// le reduce el índice a los siguientes...
			for (var layer of this.overlayMapTypesLayers) {
				if (layer.index > index) {
					layer.index--;
				}
			}
			// listo
			break;
		}
	}
};

LeafletApi.prototype.CreateLightMap = function () {
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
