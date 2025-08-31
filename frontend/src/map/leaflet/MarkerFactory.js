import iconManager from '@/common/js/iconManager';
import Svg from '@/map/js/svg';
import MarkerCreator from '@/map/classes/MarkerCreator';

export default MarkerFactory;

// test https://jsfiddle.net/sxvLykkt/5/

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
	var geo = [feature.lat, feature.lon];
	var z = window.SegMap.frame.Zoom;
	var params = {};
	var element;

	var zIndexOffset = (1000 - this.activeSelectedMetric.index) * 100;

	params.map = loc.Maps.map;
	params.position = geo;
	params.zIndexOffset = zIndexOffset + (isSequenceInactiveStep ? 5 : 10);

	var scale = this.CalculateMarkerScale(markerSettings, z);
	var isSmallZoom = scale < .4;
	var srcImage = null;
	var delegates = this.createDelegates(metric, feature, z);
	if (!isSequenceInactiveStep) {
		// Es un marker normal
		var categorySymbol = this.activeSelectedMetric.ResolveValueLabelSymbol(labelId);
		var effectiveType = (categorySymbol ? 'I' : markerSettings.Type);
		var content = this.resolveContent(markerSettings, feature.Symbol, categorySymbol);
		var labelInfo;
		var isCustom = effectiveType === 'I' && iconManager.isCustom(content);
		if (isCustom) {
			labelInfo = null;
			if (!isSmallZoom) {
				// Crea el pseudo-marker con la descripción
				srcImage = this.customIcons[content];
			}
		} else {
			labelInfo = this.createLabel(effectiveType, content);
		}
		params.icon = this.createFrame(markerSettings.Frame, style, scale, labelInfo, srcImage);

		element = new L.marker(params.position, { icon: params.icon, zIndexOffset: params.zIndexOffset });
		element.addTo(this.Maps.map);
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
		var labelInfo = this.createLabel(sequenceMarker.Type, '' + feature.Sequence);
		params.icon = this.createFrame(sequenceMarker.Frame, style, seqScale, labelInfo);
		//params.icon.anchor = new this.Maps.google.maps.Point(0, 0);
		element = new L.marker(params.position, params.icon, { zIndexOffset: params.zIndexOffset } );
		element.addTo(this.Maps.map);
	}
	// Listo, lo muestra...
	this.addMarkerListeners(element, delegates);

	return element;
};

MarkerFactory.prototype.createFrame = function (frameType, style, scale, labelInfo, srcImage) {
	var svgStart = '<svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox=';
	var path = '';
	var circle = '';
	var text = '';
	var image = '';
	var viewBox = '';
	var svgEnd = '</svg>';

	// según  el tipo de forma externa, hace un svg con path o con círculo
	var iconSVGpath = "";
	if (frameType === 'C') {
		circle = '<circle fill="{mapIconColor}" cx="12" cy="12" r="12" stroke="{strokeColor}" stroke-width="{strokeWeight}" />';
	} else {
		// Puede ser P:pin o B:box
		iconSVGpath = (frameType === 'P' ? Svg.markerPincheNormal : Svg.markerSquare);
		path = '<path fill="{mapIconColor}" stroke="{strokeColor}" stroke-width="{strokeWeight}" d="{path}"/>';
	}
	if (frameType === 'P') {
		viewBox = '"0 0 24 33">';
	} else {
		viewBox = '"0 0 24 24">';
	}

	// se fija si tiene una imagen
	if (srcImage) {
		image = '<image width="16" href="{srcImage}" x="4" y="4" />';
	}
	// agrega la entrada para el texto o íconos basados en font
	if (labelInfo && (labelInfo.text || labelInfo.unicode)) {
		text = '<text x="50%" y="13" font-weight="{fontWeight}" font-family="{fontFamily}" font-size="14px" dominant-baseline="middle" text-anchor="middle">{content}</text>';
	}
	// compone el html
	var svg = svgStart + viewBox + path + circle + image + text + svgEnd;

	var iconSettings = {
		mapIconColor: style.fillColor, // zindex
		strokeWeight: style.strokeWeight,
		strokeColor: style.strokeColor,
		path: iconSVGpath,
		fontWeight: '',
		fontFamily: '',
		text: '',
		srcImage: '',
	};
	if (labelInfo) {
		if (labelInfo.weight) {
			iconSettings.fontWeight = labelInfo.weight;
		}
		if (labelInfo.family) {
			iconSettings.fontFamily = labelInfo.family;
		}
		if (labelInfo.text) {
			iconSettings.content = labelInfo.text;
		} else if (labelInfo.unicode) {
			iconSettings.content = labelInfo.unicode;
		}
	};
	if (srcImage) {
		iconSettings.srcImage = srcImage;
	}
	var icon = L.divIcon({
		className: "",
		html: L.Util.template(svg, iconSettings),//.replace('#','%23'),
		iconAnchor: [ 12, (frameType === 'P' ? 32 : 24)],
		iconSize: [22 * scale, (frameType === 'P' ? 32 : 24)],
	});

	return icon;
};

MarkerFactory.prototype.createLabel = function (markerType, content) {
	if (markerType == 'N') {
		return null;
	}
	if (markerType == 'I') {
		return this.formatIcon(content);
	} else if (markerType == 'T') {
		return { text: content };
	} else {
		throw new Error('Tipo de marcador no reconocido.');
	}
};

MarkerFactory.prototype.addMarkerListeners = function (element, delegates) {
	if (delegates.click) {
		element.on('click', delegates.click);
	} else {
		element.interactive = false;
	}
	if (delegates.mouseover) {
		element.on('mouseover', delegates.mouseover);
	}
	if (delegates.mouseout) {
		element.on('mouseout', delegates.mouseout);
	}
};
