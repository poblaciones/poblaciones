import Mercator from '@/public/js/Mercator';
import h from '@/public/js/helper';

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
};

FeatureSelector.prototype.SetSelectorCanvas = function () {
	this.ClearSelectorCanvas();
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
	polygon.setMap(this.mapsApi.gMap);
	//polygon.setZIndex(10);
//	alert(polygon.getZIndex());
	this.selectorCanvasEvents = [];
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'click', this.selectorClicked));
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'mouseout', this.resetTooltip));
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'zoom_changed', this.resetTooltip));
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'center_changed', this.resetTooltip));
	this.selectorCanvasEvents.push(this.mapsApi.google.maps.event.addListener(polygon, 'mousemove', this.selectorMoved));

	this.selectorCanvas = polygon;
};

FeatureSelector.prototype.getFeature = function (event) {
	var position = h.getPosition(event);
	var ele = document.elementsFromPoint(position.Point.X, position.Point.Y);
	for (var n = 0; n < ele.length; n++) {
		if (ele[n].nodeName === 'path' && ele[n].parentElement.attributes['isFIDContainer'] &&
					ele[n].id !== null) {
			var parentInfo = {
				MetricName: ele[n].parentElement.attributes['metricName'].value,
				MetricId: ele[n].parentElement.attributes['metricId'].value,
				MetricVersionId: ele[n].parentElement.attributes['metricVersionId'].value,
				LevelId: ele[n].parentElement.attributes['levelId'].value,
				VariableId: ele[n].parentElement.attributes['variableId'].value
			};
			var desc = null;
			if (ele[n].attributes.description) {
				desc = ele[n].attributes.description.value;
			}
			return { position: position, parentInfo: parentInfo, id: ele[n].id, description: desc };
		}
	}
	return null;
};
FeatureSelector.prototype.createTooltipKiller = function () {
	var loc = window.SegMap.MapsApi.selector;
	loc.tooltipKillerTimer = setTimeout(loc.resetTooltip, 75000);
};

FeatureSelector.prototype.resetTooltip = function () {
	var loc = window.SegMap.MapsApi.selector;
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
	// Si está visible, remueve el tooltip
	// https://medelbou.wordpress.com/2012/02/03/creating-a-tooltip-for-google-maps-javascript-api-v3/
	if (loc.tooltipOverlay !== null) {
		loc.tooltipOverlay.Release();
		loc.tooltipOverlay = null;
	}
	// https://ux.stackexchange.com/questions/358/how-long-should-the-delay-be-before-a-tooltip-pops-up
	return true;
};

FeatureSelector.prototype.showTooltip = function () {
	var loc = window.SegMap.MapsApi.selector;
	var m = new Mercator();
	var coord = m.fromLatLonToGoogleLatLng(loc.tooltipLocation.Coordinate);
	var style = 'ibTooltip';
	if (loc.tooltipMarker) {
		style += ' ibTooltipNoYOffset';
	}
	var outStyle = "ibTooltipOffsetLeft mapLabels";
	loc.tooltipOverlay = window.SegMap.MapsApi.Write(loc.tooltipCandidate.description, coord, 10000000, outStyle, style, true);
	loc.createTooltipKiller();
};

FeatureSelector.prototype.startTooltipCandidate = function (feature) {
	if (feature.description) {
		var loc = window.SegMap.MapsApi.selector;
		loc.tooltipCandidate = feature;
		loc.tooltipTimer = setTimeout(loc.showTooltip, 100);
	}
};

FeatureSelector.prototype.markerMouseOver = function (event, metricVersion, fid, description) {
	var loc = window.SegMap.MapsApi.selector;
	var feature = { id: fid, description: description };
	loc.tooltipLocation = h.getPosition(event);
	if (!loc.resetTooltip(feature)) {
		// Sale porque está en el mismo feature del cual se está mostrando el tooltip
		return false;
	}
	loc.tooltipMarker = feature;
	loc.startTooltipCandidate(feature);
	return false;
};
FeatureSelector.prototype.markerMouseOut = function (event, metricVersion, fid, offset) {
	var loc = window.SegMap.MapsApi.selector;
	loc.tooltipMarker = null;
	if (loc.tooltipTimer !== null) {
		clearTimeout(loc.tooltipTimer);
	}
};

FeatureSelector.prototype.selectorMoved = function (event) {
	var loc = window.SegMap.MapsApi.selector;
	if (loc.tooltipMarker !== null) {
		return;
	}
	var feature = loc.getFeature(event);
	loc.tooltipLocation = h.getPosition(event);
	var pointer;
	if (!loc.resetTooltip(feature)) {
		// Sale porque está en el mismo feature del cual se está mostrando el tooltip
		return;
	}
	if (feature !== null && feature.id) {
		pointer = 'pointer';
		loc.startTooltipCandidate(feature);
	} else {
		pointer = 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur),default';
	}
	var currentPointer = loc.selectorCanvas.cursor;
	if (currentPointer !== pointer) {
		loc.selectorCanvas.cursor = pointer;
	}
};

FeatureSelector.prototype.selectorClicked = function (event) {
	var loc = window.SegMap.MapsApi.selector;
	window.SegMap.MapsApi.ResetInfoWindow();
	var feature = loc.getFeature(event);
	if (feature !== null) {
		window.SegMap.InfoRequestedInteractive(feature.position, feature.parentInfo, feature.id, null);
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
