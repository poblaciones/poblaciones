import h from '@/public/js/helper';
import arr from '@/common/framework/arr';
import iconManager from '@/common/js/iconManager';
import Svg from '@/public/js/svg';

export default MarkerFactory;

function MarkerFactory(MapsApi, activeSelectedMetric, variable, customIcons) {
	this.activeSelectedMetric = activeSelectedMetric;
	this.variable = variable;
	this.customIcons = customIcons;
	this.MapsApi = MapsApi;

	this.stylesCache = [];
	this.iconsCache = {};
};

MarkerFactory.prototype.CreateMarker = function (tileKey, feature, markerSettings, isSequenceInactiveStep) {
	var loc = this;
	var metric = loc.activeSelectedMetric;
	var variable = this.variable;
	var labelId = feature.LabelId;
	var keyLabel = 'L' + labelId;
	if (!tileKey) {
		throw new Exception('El tilekey no puede ser nulo');
	}
	var style;
	if (keyLabel in loc.stylesCache) {
		style = loc.stylesCache[keyLabel];
	} else {
		style = metric.ResolveStyle(variable, labelId);
		loc.stylesCache[keyLabel] = style;
	}
	var geo = new loc.MapsApi.google.maps.LatLng(feature.lat, feature.lon);
	var z = window.SegMap.frame.Zoom;
	var params = {};
	var element;

	var zIndex = (1000 - this.activeSelectedMetric.index) * 100;

	params.map = loc.MapsApi.gMap;
	params.position = geo;
	params.optimized = false;
	params.zIndex = zIndex + (isSequenceInactiveStep ? 5 : 10);

	var scale = this.CalculateMarkerScale(markerSettings, z);
	var isSmallZoom = scale < .4;
	/*if (isSmallZoom) {
		params.optimized = true;
	}*/

	var delegates = this.createDelegates(metric, feature, z);
	if (!isSequenceInactiveStep) {
		// Es un marker normal
		var categorySymbol = this.activeSelectedMetric.ResolveValueLabelSymbol(labelId);
		var content = this.resolveContent(markerSettings, feature.Symbol, categorySymbol);
		params.icon = this.createFrame(markerSettings, style, scale);
		var labelInfo = this.createLabel(metric, markerSettings, scale, content);
		element = new loc.MapsApi.google.maps.Marker(params);

		if (!isSmallZoom) {
			// Crea el pseudo-marker con la descripción
			var isCustom = markerSettings.Type === 'I' && iconManager.isCustom(content);
			// Crea un pseudo-marker con la imagen
			if (isCustom) {
				var imageMarker = this.createImageSubMarker(geo, content, markerSettings, scale, params.zIndex + 15);
				if (imageMarker) {
					element.extraMarkerImage = imageMarker;
					this.addMarkerListeners(imageMarker, delegates);
				}
			}
		}
	}
	// Listo, lo muestra...
	this.addMarkerListeners(element, delegates);

	return element;
};

MarkerFactory.prototype.createDelegates = function (metric, feature, z) {
	var delegates = {};
	var loc = this;
	var parentInfo = metric.CreateParentInfo(loc.variable, feature);
	var featureId = feature.id;

	if (this.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo) {
		delegates.click = function (e) {
			loc.MapsApi.markerClicked(e, parentInfo, featureId);
		};
	} else {
		delegates.click = null;
	}
	delegates.mouseover = function (e) {
		loc.MapsApi.selector.markerMouseOver(e, parentInfo, feature.id,
			feature.Description,
			feature.Value);
	};
	delegates.mouseout = function (e) {
		loc.MapsApi.selector.markerMouseOut(e);
	};
	return delegates;
};

MarkerFactory.prototype.destroyMarker = function (tileKey, marker) {
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

MarkerFactory.prototype.createImageSubMarker = function (location, symbol, marker, scale, zIndex) {
	var anchor;
	var size;
	if (marker.Frame === 'P') {
		anchor = new this.MapsApi.google.maps.Point(7 * scale, 28 * scale);
		size = 14;
	} else if (marker.Frame === 'C') {
		anchor = new this.MapsApi.google.maps.Point(7.5 * scale, 19.5 * scale);
		size = 16;
	} else if (marker.Frame === 'B') {
		anchor = new this.MapsApi.google.maps.Point(9 * scale, 21 * scale);
		size = 18;
	}

	var src = this.customIcons[symbol];
	if (!src) {
		return null;
	}
	var marker = new this.MapsApi.google.maps.Marker({
		position: location,
		map: this.MapsApi.gMap,
		clickable: true,
		optimized: false,
		zIndex: zIndex + 1,
		icon: {
			url: src,
			scaledSize: new this.MapsApi.google.maps.Size(size * scale, size * scale),
			anchor: anchor
		}
	});
	return marker;
};

MarkerFactory.prototype.createFrame = function (marker, style, scale) {
	var iconSVGpath = null;
	switch (marker.Frame) {
		case 'P':
			iconSVGpath = Svg.markerPinche;
	//		icon.labelOrigin = new this.MapsApi.google.maps.Point(11.5, 11);
		//	icon.anchor = new this.MapsApi.google.maps.Point(11.5, 32);
			break;
		case 'C':
	//		icon.path = this.MapsApi.google.maps.SymbolPath.CIRCLE;
	//		icon.anchor = new this.MapsApi.google.maps.Point(0, 1);
			if (scale < 1.5) {
				icon.labelOrigin = new this.MapsApi.google.maps.Point(0, 0.1);
			}
			scale *= 12;
			break;
		case 'B':
			iconSVGpath = Svg.markerSquare;
		//	icon.anchor = new this.MapsApi.google.maps.Point(12, 24);
		//	icon.labelOrigin = new this.MapsApi.google.maps.Point(12, 12);
			break;
		default:
			throw new Error('Tipo de marco no reconocido.');
	}

	const svgIcon = L.divIcon({
  html: `
				<svg
					width="24"
					height="40"
					viewBox="0 0 100 100"
					version="1.1"
					preserveAspectRatio="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="` + iconSVGpath + `" stroke="#FFF"></path>
				</svg>`,
					className: "",
					iconSize: [24, 40],
					iconAnchor: [12, 40],
				});

	/*
	var icon = this.objectClone(style);
	icon.strokeColor = 'white';
	icon.fillOpacity = 1;
	switch (marker.Frame) {
		case 'P':
			icon.path = Svg.markerPinche;
			icon.labelOrigin = new this.MapsApi.google.maps.Point(11.5, 11);
			icon.anchor = new this.MapsApi.google.maps.Point(11.5, 32);
			break;
		case 'C':
			icon.path = this.MapsApi.google.maps.SymbolPath.CIRCLE;
			icon.anchor = new this.MapsApi.google.maps.Point(0, 1);
			if (scale < 1.5) {
				icon.labelOrigin = new this.MapsApi.google.maps.Point(0, 0.1);
			}
			scale *= 12;
			break;
		case 'B':
			icon.path = Svg.markerSquare;
			icon.anchor = new this.MapsApi.google.maps.Point(12, 24);
			icon.labelOrigin = new this.MapsApi.google.maps.Point(12, 12);
			break;
		default:
			throw new Error('Tipo de marco no reconocido.');
	}
	icon.scale = scale; */
	return icon;
};

MarkerFactory.prototype.createDescriptionSubmarker = function (location, description, marker, scale, zIndex) {
	var fontScale = (10 * scale);
	if (scale < 1.5)
		fontScale *= 1.1;
	var topOffset;
	if (marker.DescriptionVerticalAlignment == 'T') {
		topOffset = -(marker.Frame == 'P' ? 40 : 32) * scale;
	} else if (marker.DescriptionVerticalAlignment == 'B') {
		topOffset = 6 * scale;
	} else if (marker.DescriptionVerticalAlignment == 'M') {
		topOffset = -(marker.Frame == 'P' ? 20 : 13) * scale;
	} else {
		throw new Error("Alineación inválida");
	}

	var marker = new this.MapsApi.google.maps.Marker({
      position: location,
      map: this.MapsApi.gMap,
			clickable: true,
			optimized: false,
			zIndex: zIndex,
      label: {   fontSize: fontScale + 'px',
					text: description },
      icon: { labelOrigin : new this.MapsApi.google.maps.Point(0, topOffset),
       	path: 'M 0,0  z',
      }
	});
	return marker;
};

MarkerFactory.prototype.resolveContent = function (marker, variableSymbol, categorySymbol) {
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

MarkerFactory.prototype.createLabel = function (metric, marker, scale, content) {
	if (marker.Type == 'N') {
		return null;
	}
	var symbol;
	if (marker.Type == 'I') {
		symbol = this.formatIcon(content);
	} else if (marker.Type == 'T') {
		symbol = this.formatText(content);
	} else {
		throw new Error('Tipo de marcador no reconocido.');
	}
	if (!symbol.unicode) {
		// es custom
		return null;
	}
	if (marker.Frame == 'B') {
		scale *= 1.5;
	}
	var fontSize = (12 * scale).toFixed(1);
	return {
			color: 'white',
			fontSize: fontSize + 'px',
			fontWeight: symbol['weight'],
			fontFamily: symbol['family'],
			text: symbol['unicode']
		};
};

MarkerFactory.prototype.formatText = function (content) {
	return { weight: '400', unicode: content };
};

MarkerFactory.prototype.formatIcon = function (symbol) {
	var cached = this.iconsCache[symbol];
	if (cached) {
		return cached;
	}
	var ret = iconManager.formatIcon(symbol);
	this.iconsCache[symbol] = ret;
	return ret;
};

MarkerFactory.prototype.CalculateMarkerScale = function (marker, z) {
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

MarkerFactory.prototype.addMarkerListeners = function (element, delegates) {
	if (delegates.click) {
		element.addListener('click', delegates.click);
	} else {
		element.clickable = false;
	}
	if (delegates.mouseover) {
		element.addListener('mouseover', delegates.mouseover);
	}
	if (delegates.mouseout) {
		element.addListener('mouseout', delegates.mouseout);
	}
};

MarkerFactory.prototype.objectClone = function (obj) {
	if (obj === null || typeof obj !== 'object') return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
};

MarkerFactory.prototype.dispose = function () {

};
