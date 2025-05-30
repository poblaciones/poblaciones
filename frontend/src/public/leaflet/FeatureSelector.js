import Mercator from '@/public/js/Mercator';
import h from '@/public/js/helper';
import str from '@/common/framework/str';

export default FeatureSelector;

function FeatureSelector(mapsApi) {
	this.MapsApi = mapsApi;
	this.tooltipLocation = null;
	this.selectorCanvas = null;
	this.selectorCanvasEvents = null;
	this.tooltipMarker = null;
	this.tooltipCandidate = null;
	this.tooltipTimer = null;
	this.tooltipOverlays = [];
	this.tooltipKillerTimer = null;
	this.disabled = false;
	this.tooltipOverlaysPaths = null;
};

FeatureSelector.prototype.SetSelectorCanvas = function () {
	this.ClearSelectorCanvas();
	var zeroItem = [
		[ 0, 90 ],
		[ 180, 90 ],
		[ 180, -90 ],
		[ 0, -90 ],
		[ -180, -90 ],
		[ -180, 0 ],
		[ -180, 90 ],
		[ 0, 90 ]
	];
	// Construct the polygon.
	var featureMask = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }};
	featureMask.geometry.coordinates.push(zeroItem);

	var cursor = 'default';
	var polygon = L.geoJson(featureMask, { interactive: true } );
	polygon.setStyle({
			cursor: cursor,
			color: "#FF0000",
			weight: 0,
			fillOpacity: 0
	});

	if (!this.disabled) {
		polygon.addTo(this.MapsApi.map);
	}
	this.selectorCanvasEvents = [];
//this.selectorCanvasEvents.push(polygon.on('click', this.selectorClicked));
	this.subscribe('click', this.selectorClicked);

//this.selectorCanvasEvents.push(polygon.on('mouseout', this.resetTooltip));
	this.subscribe('mouseout', this.resetTooltip);

	this.subscribe('zoom_changed', this.resetTooltip);
	this.subscribe('center_changed', this.resetTooltip);
//this.selectorCanvasEvents.push(polygon.on('mousemove', this.selectorMoved));
	this.subscribe('mouseup', this.selectorUp);
	this.subscribe('mousedown', this.selectorDown);
	this.subscribe('mousemove', this.selectorMoved);

	this.selectorCanvas = polygon;
};

FeatureSelector.prototype.subscribe = function (eventName, callback) {
	this.MapsApi.map.on(eventName, callback);
	this.selectorCanvasEvents.push({ eventName: eventName, callback: callback });
};

FeatureSelector.prototype.getFeature = function (event) {
	// Devuelve un elemento a partir de los detectados en ese punto.
	// Solo devuelve un boundary si no hay otros polígonos coincidentes.
	var matchBoundary = null;
	var position = h.getPosition(event);
	var elements = document.elementsFromPoint(position.Point.X, position.Point.Y);
	var ev = event.originalEvent;
	var gls = [];

	for (var n = 0; n < elements.length; n++) {
		var ele = elements[n];
		if (ele.id == 'deckgl-overlay') {
			gls.push(ele);
		}
		if (ele.nodeName === 'path' && ele.parentElement && ele.parentElement.parentElement &&
			ele.parentElement.parentElement.attributes['isFIDContainer']) {
			// sirve...
			var item = this.createItemFromElement(ele, position);
			if (item.id !== null || item.description !== null || item.value !== null)
			if (item.parentInfo.BoundaryId) {
				if (!matchBoundary) {
					// lo precasifica
					matchBoundary = item;
				}
			} else {
				// devuelve el item
				matchBoundary = item;
				break;
			}
		}
	} // lo pasa a los elementos de deckGl
	for (var gl of gls) {
		if (ev.type == 'click' || ev.type == 'mousemove') {
			var obj = this.getDeckElement(event);
			// tiene en OBJ lo que precisa...
			if (obj) {
				if (obj.properties) {
					obj = obj.properties;
				}
				var activeSelectedMetric = window.SegMap.GetActiveMetricByVariableId(obj.VID);
				var variable = activeSelectedMetric.GetVariableById(obj.VID);

				var parentInfo = activeSelectedMetric.CreateParentInfo(variable, obj);

				/* */
				var desc = null;
				var value = null;
				var fid = null;
				desc = obj.Description;
				value = obj.Value;
				fid = obj.FID;
				matchBoundary = {
					position: position, parentInfo: parentInfo,
					id: fid,
					description: desc,
					value: value
				};
				if (ev.type == 'click') {
					this.MapsApi.markerClicked(event, parentInfo, obj.FID);
					event.originalEvent.cancelBubble = true;
					event.originalEvent.stopPropagation = true;
				}
			}
		}
	}
	return matchBoundary;
};

FeatureSelector.prototype.getDeckElement = function (event) {
	var obj = null;
	var yOffset = document.getElementById('holder').style.top;
	if (!yOffset) {
		yOffset = 0;
	} else {
		yOffset = parseInt(yOffset);
	}
	for (var overlay of this.MapsApi.overlayMapTypesLayers) {
		if (overlay.getLayers) {
			for (var layer of overlay.getLayers()) {
				if (layer._deck) {
					var deck = layer._deck;
					var feature = null;
					try {
						feature = deck.pickObject({
							x: event.originalEvent.clientX,
							y: event.originalEvent.clientY - yOffset
						});
					} catch { };

					if (feature && feature.object) {
						return feature.object;
					}
				}
			}
		}
	}
	return null;
};

FeatureSelector.prototype.createItemFromElement = function (element, position) {
	var parentInfo;
	var parentAttributes = element.parentElement.parentElement.attributes;
	if (parentAttributes['variableId']) {
		parentInfo = {
			MetricId: parentAttributes['metricId'].value,
			MetricVersionId: parentAttributes['metricVersionId'].value,
			LevelId: parentAttributes['levelId'].value,
			VariableId: parentAttributes['variableId'].value /*,
			ShowInfo: (parentAttributes['showInfo'].value === "1") */
		};
	} else {
		var boundaryId = parentAttributes['boundaryId'].value;
		parentInfo = {
			BoundaryId: boundaryId
		};
	}
	var desc = null;
	var value = null;
	var fid = null;
	if (element.attributes.description) {
		desc = element.attributes.description.value;
	}
	if (element.attributes.value) {
		value = element.attributes.value.value;
	}
	if (element.attributes.FID) {
		fid = element.attributes.FID.value;
	}
	return {
		position: position, parentInfo: parentInfo,
		id: fid,
		description: desc,
		value: value
	};
};

FeatureSelector.prototype.createTooltipKiller = function () {
	var loc = window.SegMap.MapsApi.selector;
	loc.tooltipKillerTimer = setTimeout(loc.resetTooltip, 75000);
};

FeatureSelector.prototype.resetTooltip = function (feature) {
	if (this.disabled) {
		return;
	}
	var loc = window.SegMap.MapsApi.selector;
	if (feature) {
		if (loc.tooltipCandidate && feature.id == loc.tooltipCandidate.id) {
			return false;
		}
	}

	if (loc.tooltipKillerTimer !== null) {
		clearTimeout(loc.tooltipKillerTimer);
	}
	if (loc.tooltipCandidate === null) {
		return true;
	}
	loc.tooltipCandidate = null;
	if (loc.tooltipTimer !== null) {
		clearTimeout(loc.tooltipTimer);
	}
	loc.tooltipTimer = null;
	loc.hideTooltip();
	// https://ux.stackexchange.com/questions/358/how-long-should-the-delay-be-before-a-tooltip-pops-up
	return true;
};

FeatureSelector.prototype.hideTooltip = function () {
	// Si está visible, remueve el tooltip
	this.resetTooltipOverlays();
	if (this.tooltipOverlays.length > 0) {
		for (var tooltipOverlay of this.tooltipOverlays) {
			tooltipOverlay.overlay.Release();
		}
		this.tooltipOverlays = [];
	}
};

FeatureSelector.prototype.showTooltip = function () {
	var loc = window.SegMap.MapsApi.selector;

	if (loc.tooltipCandidate === null) {
		var e = loc.tooltipEvent;
		if (e === null) {
			return;
		}
		var feature = loc.getFeature(e);
		if (!feature || (!feature.description && !feature.value)) {
			return;
		}
		loc.tooltipCandidate = feature;
	}
	var m = new Mercator();
	var coord = loc.tooltipLocation.Coordinate;
	var style = 'ibTooltip exp-hiddable-block';
	var outStyle = "ibTooltipOffsetLeft mapLabels";
	if (loc.tooltipMarker) {
		outStyle += ' ibTooltipNoYOffset';
	}
	var html = h.renderTooltip(loc.tooltipCandidate);
	var tooltipOverlay = window.SegMap.MapsApi.Write(html, coord, 10000000, outStyle, style, true);
	loc.tooltipOverlays.push(tooltipOverlay);
	tooltipOverlay.alwaysVisible = true;
	loc.setTooltipOverlays();

	loc.createTooltipKiller();
};

FeatureSelector.prototype.setTooltipOverlays = function () {
	this.resetTooltipOverlays();

	var items = document.querySelectorAll('path[FID="' + this.tooltipCandidate.id + '"]');
	if (!items) {
		return;
	}
	this.tooltipOverlaysPaths = [];
	for (var n = 0; n < items.length; n++) {
		var clone = items[n].cloneNode();
		clone.setAttribute('class', 'activePath');
		var parent = items[n].parentElement.parentElement;
		var scaling = parent.getAttribute('scaling');
		var scale = (scaling ? parseFloat(scaling) : 1);
		clone.style.filter = "drop-shadow(" + (12 / scale) + "px 0 " + (24 / scale) + "px #333)";

		parent.appendChild(clone);
		this.tooltipOverlaysPaths.push(clone);
	}
};

FeatureSelector.prototype.resetTooltipOverlays = function () {
	if (!this.tooltipOverlaysPaths) {
		return;
	}
	for (var n = 0; n < this.tooltipOverlaysPaths.length; n++) {
		this.tooltipOverlaysPaths[n].remove();
	}
	this.tooltipOverlaysPaths = null;
};


FeatureSelector.prototype.startTooltipCandidate = function (feature) {
	var loc = window.SegMap.MapsApi.selector;
	loc.tooltipEvent = null;
	loc.tooltipCandidate = feature;
	if (loc.tooltipTimer !== null) {
		clearTimeout(loc.tooltipTimer);
	}
	loc.tooltipTimer = setTimeout(loc.showTooltip, 100);
};

FeatureSelector.prototype.startTooltipCandidateByLocation = function () {
	var loc = window.SegMap.MapsApi.selector;
	loc.tooltipCandidate = null;
	if (loc.tooltipTimer !== null) {
		clearTimeout(loc.tooltipTimer);
	}
	loc.tooltipTimer = setTimeout(loc.showTooltip, 100);
};

FeatureSelector.prototype.markerMouseOver = function (event, parentInfo, fid, description, value) {
	var loc = window.SegMap.MapsApi.selector;
	var feature = { id: fid, description: description, value: value, parentInfo: parentInfo };
	if (!event.latlng) {
		// viene de deckgl
		var pt = L.point(event.layerX, event.layerY);
		var latLng = this.MapsApi.map.containerPointToLatLng(pt);
		var ev = { originalEvent: event, layerPoint: pt, latlng: latLng };
		loc.tooltipLocation = h.getPosition(ev);
	} else {
		loc.tooltipLocation = h.getPosition(event);
	}
	if (!loc.resetTooltip(feature)) {
		// Sale porque está en el mismo feature del cual se está mostrando el tooltip
		return false;
	}
	loc.tooltipMarker = feature;
	loc.startTooltipCandidate(feature);
	return true;
};

FeatureSelector.prototype.markerMouseOut = function (event) {
	var loc = window.SegMap.MapsApi.selector;
	loc.tooltipMarker = null;
	if (loc.tooltipTimer !== null) {
		clearTimeout(loc.tooltipTimer);
		return true;
	} else {
		return false;
	}
};

FeatureSelector.prototype.selectorMoved = function (event) {
	var loc = window.SegMap.MapsApi.selector;
	if (loc.disabled) {
		return;
	}
	if (event.originalEvent && event.originalEvent.isSelf) {
		return;
	}

/*	if (loc.tooltipMarker !== null) {
		return;
	} */
	// TODO: sale porque no pasó 100 ms en el mismo lugar,
	// o porque ya fue procesado ese lugar;
	//return;

	loc.tooltipLocation = h.getPosition(event);
	loc.tooltipEvent = event;

	if (loc.tooltipOverlays.length > 0) {
		// averigua si está en él mismo
		var feature = loc.getFeature(event);
		if (feature && loc.tooltipCandidate && feature.id === loc.tooltipCandidate.id) {
			return;
		}
		loc.resetTooltip();
	}

	loc.tooltipCandidate = null;
	if (loc.tooltipTimer !== null) {
		clearTimeout(loc.tooltipTimer);
	}
	loc.tooltipTimer = null;

	loc.startTooltipCandidateByLocation();
};


FeatureSelector.prototype.selectorUp = function (event) {
	if (window.SegMap.MapsApi.draggingDelayed) {
		return false;
	}
	if (event.originalEvent && event.originalEvent.isSelf) {
		return false;
	}
	var loc = window.SegMap.MapsApi.selector;
	var feature = loc.getFeature(event);
};

FeatureSelector.prototype.selectorDown = function (event) {
	/*if (window.SegMap.MapsApi.draggingDelayed) {
		return false;
	}*/
	if (event.originalEvent && event.originalEvent.isSelf) {
		return false;
	}

	var loc = window.SegMap.MapsApi.selector;
	var feature = loc.getFeature(event);
	/*	if (feature) {
		feature = {
			id: feature.object.id, position: {
					Coordinate: { Lat: feature.object.Lat, Lon: feature.object.Lon }
				},
				id: feature.object.FID
			};
		}*/

};


FeatureSelector.prototype.selectorClicked = function (event) {
	if (window.SegMap.MapsApi.draggingDelayed) {
		return false;
	}
	if (event.originalEvent && event.originalEvent.isSelf) {
		return false;
	}
	var loc = window.SegMap.MapsApi.selector;

	var feature = loc.getFeature(event);

	/*if (!feature) {
		feature = this.MapsApi.overlayMapTypesLayers[1].getLayers()[0]._deck.pickObject({
			x: event.originalEvent.offsetX,
			y: event.originalEvent.offsetY
		});
		if (feature) {
			feature = {
				id: feature.object.id, position: {
					Coordinate: { Lat: feature.object.Lat, Lon: feature.object.Lon }
				},
				id: feature.object.FID
			};
		}
	}*/

	if (feature === null || !feature.id) {
		loc.resetTooltip();
		return false;
	} else {
		loc.resetTooltip(feature);
	}
	if (feature.parentInfo.BoundaryId) {
			window.SegMap.SelectId('C', feature.id, null, null, event.ctrlKey);
		} else {
			//if (feature.parentInfo.ShowInfo) {
				window.SegMap.InfoWindow.InfoRequestedInteractive(feature.position, feature.parentInfo, feature.id);
			//}
	}
	return true;
};

FeatureSelector.prototype.ClearSelectorCanvas = function () {
	if (this.selectorCanvas !== null) {
		this.MapsApi.map.removeLayer(this.selectorCanvas);
		this.selectorCanvas = null;
		if (this.selectorCanvasEvents) {
			for (var selectorCanvasEvent of this.selectorCanvasEvents) {
				this.MapsApi.map.off(selectorCanvasEvent.eventName, selectorCanvasEvent.callback);
			}
			this.selectorCanvasEvents = null;
		}
		return true;
	} else {
		return false;
	}
};
