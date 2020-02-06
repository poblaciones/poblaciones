import h from '@/public/js/helper';
import str from '@/common/js/str';

export default SaveRoute;

// clase que administra la ruta. el formato es:
//    /#@<lat>,<long>,<zoom>z&l<summaryClippingLevel>!r<clippingRegionId>!f<clippingFeatureId>!c<clippingCircle>/l=<metricsInfo>
// donde:
// - clippingCircle: <centerLat>,<centerLong>,<radiusLat>,<radiusLong>
// - metricsInfo: <metric>;<metric>;...<metricN>
// - metric: <metricId>!v<versionIndex>!a<levelIndex>!i<variableIndex>!c<labelsCollapsed>!m<summaryMetric>!u<urbanity>!d<showDescriptions>!s<showValues>!t<showTotals>!r<variablesStates>
//          Defaults para ausentes: c: false, m: N, u: N, d:0, s:0, t: 1
// - variablesStates: <varState>,<varState>,...<varState>
// - varState: <varVisible><valueVisible><valueVisible>...<valueVisibleN> (todos en 0 o 1)
//          Defaults: si todos los valueVisible están en 1, se omiten.

function SaveRoute(map) {
	this.segmentedMap = map;
	this.Disabled = false;
	this.DisableOnce = false;
	this.lastState = null;
};

SaveRoute.prototype.UpdateRoute = function (coord) {
	if (this.Disabled) {
		return;
	}
	if (this.DisableOnce) {
		this.DisableOnce = false;
		return;
	}

	var args = this.calculateState(coord);
	if (this.lastState === args) {
		return;
	}
	this.lastState = args;
	var urlPath = document.location.pathname;
	urlPath = h.ensureFinalBar(urlPath);
	urlPath += '#/' + args;

	window.history.pushState({ 'route': args }, '', urlPath);
};

SaveRoute.prototype.RemoveWork = function () {
	var args = this.calculateState();
	var pathArray = window.location.pathname.split('/');
	if (pathArray.length > 0 && pathArray[pathArray.length - 1] === '') {
		pathArray.pop();
	}
	if (pathArray.length > 0 && str.isNumeric(pathArray[pathArray.length - 1])) {
		pathArray.pop();
	}
	var urlPath = pathArray.join('/');
	urlPath += '/#/' + args;

	window.history.pushState({ 'route': args }, '', urlPath);
};

SaveRoute.prototype.calculateState = function (coord) {
	var ret = this.framingToRoute(coord);
	ret += this.calculateMetricsState();
	return ret;
};

SaveRoute.prototype.calculateMetricsState = function () {
	var segmentedMap = this.segmentedMap;
	if (segmentedMap.Metrics.metrics.length === 0) {
		return '';
	}
	var metricsInfo = '';
	for (var l = 0; l < segmentedMap.Metrics.metrics.length; l++) {
		metricsInfo += (metricsInfo !== '' ? ';' : '') + segmentedMap.Metrics.metrics[l].$Router.ToRoute();
	}
	return '/l=' + metricsInfo;
};

SaveRoute.prototype.framingToRoute = function (coord) {
	var segmentedMap = this.segmentedMap;
	var center;
	if (coord === undefined) {
		center = this.calculateCenter(segmentedMap.frame.Envelope);
	} else {
		center = this.coordinateToParam(coord);
	}
	var ret = '@' + center + ',' + segmentedMap.frame.Zoom + 'z';
	var mapType = this.segmentedMap.GetMapTypeState();
	if (mapType !== 'r') {
		ret += ',' + mapType;
	}
	var clippingLevel = '';
	if (segmentedMap.Clipping.clipping.Region.SelectedLevelIndex !== segmentedMap.Clipping.clipping.Region.Levels.length - 1 &&
		segmentedMap.Clipping.clipping.Region.Levels && segmentedMap.Clipping.clipping.Region.SelectedLevelIndex < segmentedMap.Clipping.clipping.Region.Levels.length) {
		clippingLevel = 'l' + segmentedMap.Clipping.clipping.Region.Levels[segmentedMap.Clipping.clipping.Region.SelectedLevelIndex].Revision;
	}
	if (segmentedMap.Clipping.FrameHasNoClipping() === false || clippingLevel !== '') {
		ret += '&' + clippingLevel;
		if (segmentedMap.frame.ClippingRegionId) {
			ret += '!r' + segmentedMap.frame.ClippingRegionId;
		}
		if (segmentedMap.frame.ClippingFeatureId) {
			ret += '!f' + segmentedMap.frame.ClippingFeatureId;
		}
		if (segmentedMap.frame.ClippingCircle) {
			ret += '!c' + this.coordinateToParam(segmentedMap.frame.ClippingCircle.Center) + ',' +
				segmentedMap.frame.ClippingCircle.Radius.Lat + ',' +
				segmentedMap.frame.ClippingCircle.Radius.Lon;
		}
	}
	return ret;
};

SaveRoute.prototype.calculateCenter = function (envelope) {
	var coordinate = this.calculateCenterAsCoordinate(envelope);
	return this.coordinateToParam(coordinate);
};
SaveRoute.prototype.calculateCenterAsCoordinate = function (envelope) {
	var coordinate = { Lat: (envelope.Min.Lat + envelope.Max.Lat) / 2, Lon: (envelope.Min.Lon + envelope.Max.Lon) / 2 };
	return coordinate;
};

SaveRoute.prototype.coordinateToParam = function (coordinate) {
	return Number(coordinate.Lat).toFixed(7) + ',' + Number(coordinate.Lon).toFixed(7);
};
