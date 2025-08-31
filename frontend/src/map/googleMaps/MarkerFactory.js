import iconManager from '@/common/js/iconManager';
import Svg from '@/map/js/svg';
import MarkerCreator from '@/map/classes/MarkerCreator';

export default MarkerFactory;

function MarkerFactory(Maps, activeSelectedMetric, variable, customIcons) {
	MarkerCreator.call(this, Maps, activeSelectedMetric, variable, customIcons);
};

MarkerFactory.prototype = new MarkerCreator();

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
	var geo = new loc.Maps.google.maps.LatLng(feature.lat, feature.lon);
	var z = window.SegMap.frame.Zoom;
	var params = {};
	var element;

	var zIndex = (1000 - this.activeSelectedMetric.index) * 100;

	params.map = loc.Maps.gMap;
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
		params.label = this.createLabel(metric, markerSettings, scale, content);
		element = new loc.Maps.google.maps.Marker(params);

		if (!isSmallZoom) {
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
	} else {
		// Es solo la pelotita de secuencia
		var sequenceMarker = {
			Frame: 'C', Size: markerSettings.Size, AutoScale: markerSettings.AutoScale, Type: 'T',
			Source: 'F', NoDescription: true
		};
		var seqScale = scale * .6;
		if (seqScale > 1) {
			seqScale = 1;
		}
		params.icon = this.createFrame(sequenceMarker, style, seqScale);
		params.icon.anchor = new this.Maps.google.maps.Point(0, 0);
		params.label = this.createLabel(metric, sequenceMarker, seqScale, '' + feature.Sequence);
		element = new loc.Maps.google.maps.Marker(params);
	}
	// Listo, lo muestra...
	this.addMarkerListeners(element, delegates);

	return element;
};

MarkerFactory.prototype.createImageSubMarker = function (location, symbol, marker, scale, zIndex) {
	var anchor;
	var size;
	if (marker.Frame === 'P') {
		anchor = new this.Maps.google.maps.Point(7 * scale, 28 * scale);
		size = 14;
	} else if (marker.Frame === 'C') {
		anchor = new this.Maps.google.maps.Point(7.5 * scale, 19.5 * scale);
		size = 16;
	} else if (marker.Frame === 'B') {
		anchor = new this.Maps.google.maps.Point(9 * scale, 21 * scale);
		size = 18;
	}

	var src = this.customIcons[symbol];
	if (!src) {
		return null;
	}
	var marker = new this.Maps.google.maps.Marker({
		position: location,
		map: this.Maps.gMap,
		clickable: true,
		optimized: false,
		zIndex: zIndex + 1,
		icon: {
			url: src,
			scaledSize: new this.Maps.google.maps.Size(size * scale, size * scale),
			anchor: anchor
		}
	});
	return marker;
};

MarkerFactory.prototype.createFrame = function (marker, style, scale) {
	var icon = this.objectClone(style);
	icon.strokeColor = 'white';
	icon.fillOpacity = 1;
	switch (marker.Frame) {
		case 'P':
			icon.path = Svg.markerPinche;
			icon.labelOrigin = new this.Maps.google.maps.Point(11.5, 11);
			icon.anchor = new this.Maps.google.maps.Point(11.5, 32);
			break;
		case 'C':
			icon.path = this.Maps.google.maps.SymbolPath.CIRCLE;
			icon.anchor = new this.Maps.google.maps.Point(0, 1);
			if (scale < 1.5) {
				icon.labelOrigin = new this.Maps.google.maps.Point(0, 0.1);
			}
			scale *= 12;
			break;
		case 'B':
			icon.path = Svg.markerSquare;
			icon.anchor = new this.Maps.google.maps.Point(12, 24);
			icon.labelOrigin = new this.Maps.google.maps.Point(12, 12);
			break;
		default:
			throw new Error('Tipo de marco no reconocido.');
	}
	icon.scale = scale;
	return icon;
};

MarkerFactory.prototype.createLabel = function (metric, marker, scale, content) {
	if (marker.Type == 'N') {
		return null;
	}
	var symbol;
	if (marker.Type == 'I') {
		if (content) {
			symbol = this.formatIcon(content);
		} else {
			return null;
		}
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


MarkerFactory.prototype.addMarkerListeners = function (element, delegates) {
		//element.clickable = false;
	//return;
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
