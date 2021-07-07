import h from '@/public/js/helper';
import str from '@/common/framework/str';

import FrameRouter from '@/public/router/FrameRouter';
import ClippingRouter from '@/public/router/ClippingRouter';
import SelectedInfoRouter from '@/public/router/SelectedInfoRouter';
import LeftPanelRouter from '@/public/router/LeftPanelRouter';
import FeatureInfoRouter from '@/public/router/FeatureInfoRouter';


export default SaveRoute;

// clase que administra la ruta. el formato es:
//    #/@<lat>,<long>,<zoom>z&l<summaryClippingLevel>!r<clippingRegionId>!f<clippingFeatureId>!c<clippingCircle>/l=<metricsInfo>
// donde:
// - clippingCircle: <centerLat>,<centerLong>,<radiusLat>,<radiusLong>
// - metricsInfo: <metric>;<metric>;...<metricN>
// - metric: <metricId>!v<versionIndex>!a<levelIndex>!i<variableIndex>!c<labelsCollapsed>!m<summaryMetric>!u<urbanity>!d<showDescriptions>!s<showValues>!t<showTotals>!r<variablesStates>
//          Defaults para ausentes: c: false, m: N, u: N, d:0, s:0, t: 1
// - variablesStates: <varState>,<varState>,...<varState>
// - varState: <varVisible><valueVisible><valueVisible>...<valueVisibleN> (todos en 0 o 1)
//          Defaults: si todos los valueVisible están en 1, se omiten.

function SaveRoute() {
	this.Disabled = false;
	this.DisableOnce = false;
	this.lastState = null;

	this.subscribers = [	new FrameRouter(),
												new ClippingRouter(),
												new SelectedInfoRouter(),
												new LeftPanelRouter(),
												new FeatureInfoRouter()	];
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
	if (this.lastState === args || str.StartsWith(args, "@0.0000000,0.0000000,0z")) {
		return;
	}
	this.lastState = args;
	var urlPath = document.location.pathname;
	urlPath = h.ensureFinalBar(urlPath);
	urlPath += '#' + args;

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
	urlPath += '/#' + args;

	window.history.pushState({ 'route': args }, '', urlPath);
};

SaveRoute.prototype.calculateState = function (coord) {
	var blocks = {};
	for (var n = 0; n < this.subscribers.length; n++) {
		var subscriber = this.subscribers[n];
		var value = this.callSubscriber(subscriber, coord);
		if (value !== '') {
			// Lo pone en el bloque que le corresponde
			var blockSignature = this.getFirstSignature(subscriber);
			var existing = blocks[blockSignature];
			var ele = { subscriber: subscriber, value: value };
			if (existing) {
				existing.push(ele);
			} else {
				blocks[blockSignature] = [ele];
			}
		}
	}
	// Lo pasa de bloques a string;
	var ret = '';
	for (var key in blocks) {
    // check if the property/key is defined in the object itself, not in parent
    if (blocks.hasOwnProperty(key)) {
			var block = blocks[key];
			var blockSignature = this.getFirstSignature(block[0].subscriber);
			ret += '/' + blockSignature;
			ret += this.addRecursive(block, null);
		 }
	}
	return ret;
};

SaveRoute.prototype.getFirstSignature = function (subscriber) {
	var config = subscriber.GetSettings();
	var blockSignature = (Array.isArray(config.blockSignature) ? config.blockSignature[0] : config.blockSignature);
	return blockSignature;
};

SaveRoute.prototype.addRecursive = function(valueList, startChar) {
	for (var n = 0; n < valueList.length; n++) {
		var config = valueList[n].subscriber.GetSettings();
		if (config.startChar === startChar) {
			var ret = valueList[n].value;
			if (config.endChar) {
				var continuation = this.addRecursive(valueList, config.endChar);
				if (continuation !== '') {
					ret += config.endChar + continuation;
					return ret;
				}
			}
			return ret;
		}
	}
	return '';
};

SaveRoute.prototype.callSubscriber = function (subscriber, coord) {
	var value = '';
	var res = subscriber.ToRoute(coord);
	if (res !== null) {
		// Lo formatea
		var config = subscriber.GetSettings();
		if (!config.groupSeparator) {
			res = [res];
		}
		for (var g = 0; g < res.length; g++) {
			if (value.length > 0 && !value.endsWith(config.groupSeparator)) {
				value += config.groupSeparator;
			}
			var group = res[g];
			var groupValue = '';
			for (var i = 0; i < group.length; i++) {
				var nextValue = this.appendValue(group[i]);
				if (groupValue.length > 0 && !groupValue.endsWith(config.itemSeparator)
					&& nextValue) {
					groupValue += config.itemSeparator;
				}
				groupValue += nextValue;
			}
			value += groupValue;
		}
	}
	return value;
};

SaveRoute.prototype.appendValue = function (val) {
	if (!Array.isArray(val)) {
		return '' + val;
	}
	if (val.length === 3 && val[1] === val[2]) {
		return '';
	}
	if (val.length === 1) {
		return '' + val[0];
	}
	if (val.length === 2 || val.length === 3) {
		return '' + val[0] + val[1];
	}
	return '';
};

