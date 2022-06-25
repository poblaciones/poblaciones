import Mercator from '@/public/js/Mercator';
import h from '@/public/js/helper';
import str from '@/common/framework/str';

export default FeatureSelector;

function FeatureSelector(mapsApi) {
	this.mapsApi = mapsApi;
	this.tooltipLocation = null;
	this.selectorCanvas = null;
	this.selectorCanvasEvents = null;
	this.tooltipMarker = null;
	this.tooltipCandidate = null;
	this.tooltipTimer = null;
	this.tooltipOverlay = null;
	this.tooltipKillerTimer = null;
	this.disabled = false;
	this.tooltipOverlayPaths = null;
};

FeatureSelector.prototype.SetSelectorCanvas = function () {
/*	this.ClearSelectorCanvas();
	var zeroItem = [
		{ lat: 0, lng: 90 },
		{ lat: 180, lng: 90 },
		{ lat: 180, lng: -90 },
		{ lat: 0, lng: -90 },
		{ lat: -180, lng: -90 },
		{ lat: -180, lng: 0 },
		{ lat: -180, lng: 90 },
		{ lat: 0, lng: 90 }
	];
	// Construct the polygon.
	var cursor = 'default';
	var polygon = new this.mapsApi.google.maps.Polygon({
		paths: zeroItem,
		strokeColor: '#FF0000',
		strokeOpacity: 0.8,
		strokeWeight: 0,
		cursor: cursor,
		fillColor: '#FF0000',
		fillOpacity: 0
	});

	if (!this.disabled) {
		polygon.setMap(this.mapsApi.gMap);
	}
	this.selectorCanvasEvents = [];
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'click', this.selectorClicked));
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'mouseout', this.resetTooltip));
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'zoom_changed', this.resetTooltip));
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'center_changed', this.resetTooltip));
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'mousemove', this.selectorMoved));

	this.selectorCanvas = polygon;
*/
};

FeatureSelector.prototype.getFeature = function (event) {
	// Devuelve un elemento a partir de los detectados en ese punto.
	// Solo devuelve un boundary si no hay otros polígonos coincidentes.
	var matchBoundary = null;
	var position = h.getPosition(event);
	var elements = document.elementsFromPoint(position.Point.X, position.Point.Y);

	for (var n = 0; n < elements.length; n++) {
		var ele = elements[n];
		if (ele.nodeName === 'path' && ele.parentElement && ele.parentElement.parentElement &&
			ele.parentElement.parentElement.attributes['isFIDContainer']) {
			// sirve...
			var item = this.createItemFromElement(ele, position);
			if (item.id !== null || item.description !== null || item.value !== null)
			if (item.parentInfo.BoundaryId) {
				if (!matchBoundary) {
					matchBoundary = item;
				}
			} else {
				return item;
			}
		}
	}
	return matchBoundary;
};

FeatureSelector.prototype.createItemFromElement = function (element, position) {
	var parentInfo;
	var parentAttributes = element.parentElement.parentElement.attributes;
	if (parentAttributes['variableId']) {
		parentInfo = {
			MetricId: parentAttributes['metricId'].value,
			MetricVersionId: parentAttributes['metricVersionId'].value,
			LevelId: parentAttributes['levelId'].value,
			VariableId: parentAttributes['variableId'].value,
			ShowInfo: (parentAttributes['showInfo'].value === "1")
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
	if (this.tooltipOverlay !== null) {
		this.tooltipOverlay.Release();
		this.tooltipOverlay = null;
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
	var coord = m.fromLatLonToGoogleLatLng(loc.tooltipLocation.Coordinate);
	var style = 'ibTooltip exp-hiddable-block';
	var outStyle = "ibTooltipOffsetLeft  mapLabels";
	if (loc.tooltipMarker) {
		outStyle += ' ibTooltipNoYOffset';
	}
	var html = loc.RenderTooltip(loc.tooltipCandidate);
	loc.tooltipOverlay = window.SegMap.MapsApi.Write(html, coord, 10000000, outStyle, style, true);
	loc.tooltipOverlay.alwaysVisible = true;
	loc.setTooltipOverlays();

	loc.createTooltipKiller();
};

FeatureSelector.prototype.setTooltipOverlays = function () {
	var items = document.querySelectorAll('path[FID="' + this.tooltipCandidate.id + '"]');
	if (!items) {
		return;
	}
	this.tooltipOverlayPaths = [];
	for (var n = 0; n < items.length; n++) {
		var clone = items[n].cloneNode();
		clone.setAttribute('class', 'activePath');
		var parent = items[n].parentElement.parentElement;
		var scaling = parent.getAttribute('scaling');
		var scale = (scaling ? parseFloat(scaling) : 1);
		clone.style.filter = "drop-shadow(" + (12 / scale) + "px 0 " + (24 / scale) + "px #333)";

		parent.appendChild(clone);
		this.tooltipOverlayPaths.push(clone);
	}
};

FeatureSelector.prototype.resetTooltipOverlays = function () {
	if (!this.tooltipOverlayPaths) {
		return;
	}
	for (var n = 0; n < this.tooltipOverlayPaths.length; n++) {
		this.tooltipOverlayPaths[n].remove();
	}
	this.tooltipOverlayPaths = null;
};

FeatureSelector.prototype.RenderTooltip = function (feature) {
	var caption = null;
	var value = null;
	if (feature.value) {
		var varName = window.SegMap.GetVariableName(feature.parentInfo.MetricId, feature.parentInfo.VariableId);
		value = str.EscapeHtml(varName) + ': ' + str.EscapeHtml(feature.value);
	}
	if (feature.description) {
		caption = feature.description;
	}
	var divider = (value !== null ? 'tpValueTitle' : '');
	var html = '';
	if (caption) {
		html = "<div class='" + divider + "'>" + str.EscapeHtml(caption) + '</div>';
	}
	if (value) {
		html += '<div>' + value + '</div>';
	}
	if (html === '') {
		html = null;
	}
	return html;
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
	loc.tooltipLocation = h.getPosition(event);
	if (!loc.resetTooltip(feature)) {
		// Sale porque está en el mismo feature del cual se está mostrando el tooltip
		return false;
	}
	loc.tooltipMarker = feature;
	loc.startTooltipCandidate(feature);
	return false;
};
FeatureSelector.prototype.markerMouseOut = function (event) {
	var loc = window.SegMap.MapsApi.selector;
	loc.tooltipMarker = null;
	if (loc.tooltipTimer !== null) {
		clearTimeout(loc.tooltipTimer);
	}
};

FeatureSelector.prototype.selectorMoved = function (event) {
	var loc = window.SegMap.MapsApi.selector;
	if (loc.disabled) {
		return;
	}
	if (loc.tooltipMarker !== null) {
		return;
	}
	// TODO: sale porque no pasó 100 ms en el mismo lugar,
	// o porque ya fue procesado ese lugar;
	//return;

	loc.tooltipLocation = h.getPosition(event);
	loc.tooltipEvent = event;

	if (loc.tooltipOverlay !== null) {
		// averigua si está en el mismo
		var feature = loc.getFeature(event);
		if (feature && feature.id === loc.tooltipCandidate.id) {
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

FeatureSelector.prototype.selectorMovedEx = function (event) {
	var loc = window.SegMap.MapsApi.selector;
	if (loc.disabled) {
		return;
	}
	if (loc.tooltipMarker !== null) {
		return;
	}
	// TODO: sale porque no pasó 100 ms en el mismo lugar,
	// o porque ya fue procesado ese lugar;
	//return;

	var feature = loc.getFeature(event);
	loc.tooltipLocation = h.getPosition(event);
	var pointer;
	if (!loc.resetTooltip(feature)) {
		// Sale porque está en el mismo feature del cual se está mostrando el tooltip
		return;
	}

	pointer = 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur),default';
	if (feature !== null && feature.id) {
		if (!feature.parentInfo.BoundaryId) {
			pointer = 'pointer';
		}
		loc.startTooltipCandidate(feature);
	} else {
	}

	var currentPointer = loc.selectorCanvas.cursor;
	if (currentPointer !== pointer) {
		loc.selectorCanvas.cursor = pointer;
	}
};

FeatureSelector.prototype.selectorClicked = function (event) {
	if (window.SegMap.MapsApi.draggingDelayed) {
		return;
	}
	var loc = window.SegMap.MapsApi.selector;
	var feature = loc.getFeature(event);
	if (feature === null || !feature.id) {
		loc.resetTooltip();
		return;
	} else {
		loc.resetTooltip(feature);
	}
	if (feature.parentInfo.BoundaryId) {
			window.SegMap.SelectId('C', feature.id, null, null, event.ctrlKey);
		} else {
			if (feature.parentInfo.ShowInfo) {
				window.SegMap.InfoWindow.InfoRequestedInteractive(feature.position, feature.parentInfo, feature.id);
			}
		}
};

FeatureSelector.prototype.ClearSelectorCanvas = function () {
	if (this.selectorCanvas !== null) {
		this.selectorCanvas.setMap(null);
		this.selectorCanvas = null;
		if (this.selectorCanvasEvents) {
			for (var n = 0; n < this.selectorCanvasEvents.length; n++) {
				this.selectorCanvasEvents[n].remove();
			}
			this.selectorCanvasEvents = null;
		}
		return true;
	} else {
		return false;
	}
};
