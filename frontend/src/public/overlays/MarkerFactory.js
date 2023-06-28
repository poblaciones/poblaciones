import iconManager from '@/common/js/iconManager';
import Svg from '@/public/js/svg';
import str from '@/common/framework/str';
import MarkerCreator from '@/public/classes/MarkerCreator';

export default MarkerFactory;

// test https://jsfiddle.net/sxvLykkt/5/

function MarkerFactory(maps, activeSelectedMetric, variable, customIcons) {
	this.errorsCache = {};
	MarkerCreator.call(this, maps, activeSelectedMetric, variable, customIcons);

	this.canvas = document.createElement("canvas");
};

MarkerFactory.prototype = new MarkerCreator();

MarkerFactory.prototype.CreateMarker = function (feature, markerSettings) {
	var loc = this;
	var metric = loc.activeSelectedMetric;
	var variable = this.variable;
	var labelId = feature.LID;
	var keyLabel = 'L' + labelId;
	var style;
	if (keyLabel in loc.stylesCache) {
		style = loc.stylesCache[keyLabel];
	} else {
		style = metric.ResolveStyle(variable, labelId);
		if (style === null) {
			if (!loc.errorsCache[keyLabel]) {
				console.error('Error', 'No se ha encontrado categoría para el valor (' + labelId + ')');
				loc.errorsCache[keyLabel] = true;
			}
			return null;
		}
		loc.stylesCache[keyLabel] = style;
	}
	var zIndexOffset = (1000 - this.activeSelectedMetric.index) * 100;

	var srcImage = null;
	// Es un marker normal
	var categorySymbol = this.activeSelectedMetric.ResolveValueLabelSymbol(labelId);
	var effectiveType = (categorySymbol ? 'I' : markerSettings.Type);
	var content = this.resolveContent(markerSettings, feature.Symbol, categorySymbol);
	var labelInfo;
	var isCustom = effectiveType === 'I' && iconManager.isCustom(content);
	if (isCustom) {
		labelInfo = null;
		srcImage = this.customIcons[content];
	} else {
		labelInfo = this.createLabel(effectiveType, content);
	}
	var icon = this.createFrame(markerSettings.Frame, style, labelInfo, srcImage);
	return icon;
};

MarkerFactory.prototype.createFrame = function (frameType, style, labelInfo, srcImage) {
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
		circle = '<circle fill="{mapIconColor}" cx="12" cy="12" r="11" stroke="{strokeColor}" stroke-width="{strokeWeight}" />';
	} else {
		// Puede ser P:pin o B:box
		iconSVGpath = (frameType === 'P' ? Svg.markerPincheNormal : Svg.markerSquare);
		path = '<path fill="{mapIconColor}" stroke="{strokeColor}" stroke-width="{strokeWeight}" d="{path}"/>';
	}
	const RESOLUTION_EXPANSOR = 2;
	var width = 24;
	var height = 24;
	if (frameType === 'P') {
		height = 32;
	}
	if (frameType === 'P') {
		viewBox = '"0 0 24 33" width="' + width * RESOLUTION_EXPANSOR + '" height="' + height * RESOLUTION_EXPANSOR + '">';
	} else {
		viewBox = '"0 0 24 24" width="' + width * RESOLUTION_EXPANSOR + '" height="' + height * RESOLUTION_EXPANSOR + '">';
	}

	var iconSettings = {
		mapIconColor: style.fillColor, // zindex
		strokeWeight: .5,
		strokeColor: 'white',
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

	// agrega la entrada para el texto o íconos basados en font
	if (labelInfo && (labelInfo.text || labelInfo.unicode)) {
		if (labelInfo.unicode) {
			var url = '';
			srcImage = this.htmlToImage(iconSettings.content, iconSettings.fontFamily, 64, iconSettings.fontWeight);
		} else {
			text = '<text x="50%" y="13" font-weight="{fontWeight}" fill="#FFFFFF" font-family="{fontFamily}" font-size="14px" dominant-baseline="middle" text-anchor="middle">{content}</text>';
		}
	}
	// se fija si tiene una imagen
	if (srcImage) {
		image = '<image width="16" href="{srcImage}" x="4" y="4" />';
	}
	// compone el html
	var svg = svgStart + viewBox + path + circle + image + text + svgEnd;

	if (srcImage) {
		iconSettings.srcImage = srcImage;
	}

	var icon = {
		svg: L.Util.template(svg, iconSettings),//.replace('#','%23'),
		iconAnchor: [RESOLUTION_EXPANSOR * 12, RESOLUTION_EXPANSOR * (frameType === 'P' ? 32 : 24)],
		iconSize: [RESOLUTION_EXPANSOR * 22, RESOLUTION_EXPANSOR * (frameType === 'P' ? 32 : 24)],
	};
	return icon;
};

MarkerFactory.prototype.htmlToImage = function (txt, fontFamily, fontSize = 24, fontWeight = 200) {
	var canvas = this.canvas;
	// Calcula el ancho
	var font = (str.isNumeric(fontWeight) ? 'normal ' : '') + fontWeight + ' ' + fontSize + "px '" + fontFamily + "'";
	var precontext = canvas.getContext("2d");
	precontext.font = font;
	var sz = precontext.measureText(txt);
	// fija el tamaño
	var cw = sz.width;
	var ch = fontSize;
	var margin = 10;
	canvas.style.width = (cw + margin) + "px";
	canvas.style.height = (ch + margin * 2) + "px";
	canvas.width = cw + margin;
	canvas.height = ch + margin * 2;
	// escribe
	var context = canvas.getContext("2d");
	context.font = font;
	//context.fillStyle = "#e9e9e9";
	//context.fillRect(0, 0, cw + 100, ch + 100);
	context.fillStyle = "white";
	var offsetY = (fontFamily == 'Flaticon' ? -10 : 0);
	context.fillText(txt, margin / 2, margin + offsetY + ch);
	var dataURL = canvas.toDataURL("image/png");
	context.clearRect(0, 0, cw, ch);
	return dataURL;
};

MarkerFactory.prototype.createLabel = function (markerType, content) {
	if (markerType == 'N') {
		return null;
	}
	if (markerType == 'I') {
		if (content) {
			return this.formatIcon(content);
		} else {
			return null;
		}
	} else if (markerType == 'T') {
		return { text: content };
	} else {
		throw new Error('Tipo de marcador no reconocido.');
	}
};

MarkerFactory.prototype.errorIcon = function () {
	var svgStart = '<svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox=';
	var svgEnd = '</svg>';
	var viewBox = '"0 0 24 33" width="24" height="32">';
	var iconSVGpath = Svg.markerPincheNormal;
	var path = '<path fill="{mapIconColor}" stroke="{strokeColor}" stroke-width="{strokeWeight}" d="{path}"/>';
	// compone el html
	var svg = svgStart + viewBox + path + svgEnd;
	var iconSettings = {	mapIconColor: 'red', // zindex
		strokeWeight: 1,
		strokeColor: 'black',
		path: iconSVGpath,
	};
	var icon = {
		svg: L.Util.template(svg, iconSettings),//.replace('#','%23'),
		iconAnchor: [12, 32],
		iconSize: [22, 32],
	};
	return icon;
};

MarkerFactory.prototype.createDelegates = function () {
	var delegates = {};
	var maps = window.SegMap.MapsApi;
	var variable = this.activeSelectedMetric.SelectedVariable();
	var loc = this;

	if (this.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo) {
		delegates.click = function (feature, event) {
			var parentInfo = loc.activeSelectedMetric.CreateParentInfo(variable, feature.object);
			return maps.markerClicked(event.srcEvent, parentInfo, feature.object.FID);
		};
	} else {
		delegates.click = null;
	}
	delegates.mouseout = function (e) {
		return maps.selector.resetTooltip(); // markerMouseOut(e.srcEvent);
	};
	delegates.mouseover = function (feature, event) {
			if (!feature.object) {
				return delegates.mouseout(event.srcEvent);
			}
			var parentInfo = loc.activeSelectedMetric.CreateParentInfo(variable, feature.object);
			return maps.selector.markerMouseOver(event.srcEvent, parentInfo, feature.object.FID,
																			feature.object.Description,
																			feature.object.Value);
	};
	return delegates;
};
