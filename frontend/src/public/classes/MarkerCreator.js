import h from '@/public/js/helper';
import arr from '@/common/framework/arr';
import iconManager from '@/common/js/iconManager';

export default MarkerCreator;

function MarkerCreator(Maps, activeSelectedMetric, variable, customIcons) {
	this.activeSelectedMetric = activeSelectedMetric;
	this.variable = variable;
	this.customIcons = customIcons;
	this.Maps = Maps;

	this.stylesCache = [];
	this.iconsCache = {};
};


MarkerCreator.prototype.createDelegates = function (metric, feature, z) {
	var delegates = {};
	var loc = this;
	var parentInfo = metric.CreateParentInfo(loc.variable, feature);
	var featureId = feature.id;

	if (this.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo) {
		delegates.click = function (e) {
			loc.Maps.markerClicked(e, parentInfo, featureId);
		};
	} else {
		delegates.click = null;
	}
	delegates.mouseover = function (e) {
		loc.Maps.selector.markerMouseOver(e, parentInfo, feature.id,
			feature.Description,
			feature.Value);
	};
	delegates.mouseout = function (e) {
		loc.Maps.selector.markerMouseOut(e);
	};
	return delegates;
};

MarkerCreator.prototype.destroyMarker = function (tileKey, marker) {
	marker.setMap(null);
	var tileItems = this.keysInTile[tileKey];
	if (tileItems) {
		arr.Remove(tileItems, marker);
	}
	if (marker.extraMarker) {
		this.destroyMarker(tileKey, marker.extraMarker);
	}
	if (marker.extraMarkerImage) {
		this.destroyMarker(tileKey, marker.extraMarkerImage);
	}
};

MarkerCreator.prototype.resolveContent = function (marker, variableSymbol, categorySymbol) {
	// Si tiene un contenido...
	var content;
	if (categorySymbol) {
		return categorySymbol;
	} else if (marker.Source === 'V') {
		content = variableSymbol;
	} else {
		if (marker.Type == 'I') {
			content = marker.Symbol;
		} else {
			content = marker.Text;
		}
	}
	return content;
};

MarkerCreator.prototype.formatText = function (content) {
	return { weight: '400', unicode: content };
};

MarkerCreator.prototype.formatIcon = function (symbol) {
	if (symbol.startsWith('fas fa-') || symbol.startsWith('far fa-')) {
		symbol = symbol.substr(4);
	}
	var cached = this.iconsCache[symbol];
	if (cached) {
		return cached;
	}
	var ret = iconManager.formatIcon(symbol);
	this.iconsCache[symbol] = ret;
	return ret;
};

MarkerCreator.prototype.CalculateMarkerScale = function (marker, z) {
	var n = 1;
	if (marker.AutoScale) {
		var adjust = 21;
		n = h.getScaleFactor(z) / adjust * .75;
	}
	if (marker.Size === 'M') {
		n *= 1.5;
	} else if (marker.Size === 'L') {
		n *= 2;
	}
	return n;
};

MarkerCreator.prototype.objectClone = function (obj) {
	if (obj === null || typeof obj !== 'object') return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
};

MarkerCreator.prototype.dispose = function () {

};
