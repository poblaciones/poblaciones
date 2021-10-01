import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import h from '@/public/js/helper';
import str from '@/common/framework/str';
import color from '@/common/framework/color';
import PatternMaker from '@/public/composers/PatternMaker';
import SvgMarkerMaker from '@/public/composers/SvgMarkerMaker';
import Mercator from '@/public/js/Mercator';
import SvgMake from './SvgMake';
import SVG from 'svg.js';
import html2canvas from 'html2canvas';
import canvg from 'canvg';

export default AbstractSvgComposer;

function AbstractSvgComposer(mapsApi, activeSelectedMetric) {
	if (!mapsApi) {
		return;
	}
	// api usada de geojson2svg en js: https://github.com/gagan-bansal/geojson2svg
	// api usada de svg: http://svgjs.com/elements/#svg-pattern
	// posible api de php https://github.com/chrishadi/geojson2svg/blob/master/geojson2svg.php
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.index = this.activeSelectedMetric.index;
	this.labelsVisibility = [];
	this.AbstractConstructor();
	this.strokeWidthScaling = 1;
	this.useGradients = false;
	this.useTextures = false;
	this.useSvgMarkers = false;
};

AbstractSvgComposer.prototype = new AbstractTextComposer();
AbstractSvgComposer.uniqueCssId = 1;


AbstractSvgComposer.prototype.CreateSVG = function (h, w, z, patternValue, tileUniqueId, parentAttributes) {
	var xmlns = 'http://www.w3.org/2000/svg';
	var boxWidth = h;
	var boxHeight = w;

	const TILE_SIZE = 256;
	const TILE_PRJ_SIZE = 8192;
	var scale = TILE_PRJ_SIZE / TILE_SIZE;

	var svgElem = document.createElementNS(xmlns, 'svg');

	svgElem.setAttributeNS(null, 'width', boxWidth);
	svgElem.setAttributeNS(null, 'height', boxHeight);
	svgElem.setAttributeNS(null, 'isFIDContainer', 1);
	svgElem.setAttributeNS(null, 'uID', tileUniqueId);
	svgElem.setAttributeNS(null, 'viewBox', "0 0 " + TILE_PRJ_SIZE + " " + TILE_PRJ_SIZE);


	for (var key in parentAttributes) {
    // check if the property/key is defined in the object itself, not in parent
		if (parentAttributes.hasOwnProperty(key)) {
			svgElem.setAttributeNS(null, key, parentAttributes[key]);
    }
	}
	svgElem.style.display = 'block';
	svgElem.style.strokeWidth = this.strokeWidthScaling * this.resolveStrokeWidth(z, patternValue) * scale + "px";
	if (patternValue > 6) {
		svgElem.style.strokeOpacity = this.activeSelectedMetric.SelectedVariable().CurrentOpacity;
	}
	return svgElem;
};

AbstractSvgComposer.prototype.resolveStrokeWidth = function (z, patternValue) {
	if (patternValue === 1) {
		var width = (z < 16 ? 1 : 1.5);
		if (this.activeSelectedMetric.borderWidth === 1) {
			width *= .5;
		} else if (this.activeSelectedMetric.borderWidth === 3) {
			width *= 2;
		}
		return width;
	}
	if (this.patternIsPipeline(patternValue)) {
		// 3,4,5,6 son cañerías
		return 0;
	}
	return (z < 16 ? 1 : 1.5);
};

AbstractSvgComposer.prototype.patternUseFillStyles = function (patternValue) {
	return (patternValue > 2);
};

AbstractSvgComposer.prototype.patternIsPipeline = function (patternValue) {
	return (patternValue >= 3 && patternValue <= 6);
};

AbstractSvgComposer.prototype.CreateSVGOverlay = function (tileUniqueId, div, parentAttributes, features,
	z, patternValue, gradient, texture) {
	var useFillPatterns = this.patternUseFillStyles(patternValue);

	var oSvg = this.CreateSVG(256, 256, z, patternValue, tileUniqueId, parentAttributes);
	var o2 = SVG.adopt(oSvg);

	var labels = this.activeSelectedMetric.GetStyleColorList();
	if (useFillPatterns) {
		this.appendPatterns(o2, labels, patternValue, z, 1);
	}

	var textureMaskId = null;
	if (this.useTextures && texture && texture.Data) {
		// NO REDUCIDO
		const TILE_PRJ_SIZE = 8192;
		var image = o2.image("data:" + texture.ImageType + ";base64," + texture.Data, TILE_PRJ_SIZE, TILE_PRJ_SIZE);

		var textureMask = o2.pattern();
		textureMask.add(image);
		textureMaskId = 'svgPatt' + tileUniqueId;
		textureMask.attr('id', textureMaskId);
	}
	var maskId = null;
	if (this.useGradients && gradient) {
		var gradientOpacity = this.activeSelectedMetric.SelectedVariable().CurrentGradientOpacity;
		if (gradientOpacity !== 0) {
			// test mask: https://jsfiddle.net/ycLsr32k/

			// NO REDUCIDO
			const TILE_PRJ_SIZE = 8192;
			var image = o2.image("data:" + gradient.ImageType + ";base64," + gradient.Data, TILE_PRJ_SIZE, TILE_PRJ_SIZE);
			var rect2 = o2.rect(TILE_PRJ_SIZE, TILE_PRJ_SIZE);
			//var image = o2.image("data:" + gradient.ImageType + ";base64," + gradient.Data, 256, 256);

			////	image.style('opacity: 0.8');
			//var rect2 = o2.rect(256, 256);
			rect2.style('fill: #FFFFFF; opacity: ' + gradientOpacity);
			// rectángulo de transparencia local
			var mask = o2.mask();
			mask.add(image);
			//mask.add(rect);
			mask.add(rect2);
			maskId = 'svgMasks' + tileUniqueId;
			mask.attr('id', maskId);
		}
	}
	this.appendStyles(oSvg, tileUniqueId, labels, patternValue, maskId, textureMaskId);
	if (this.useSvgMarkers) {
		this.appendSegmentMarkers(o2, labels, z, 1);
	}
	var svgMake = new SvgMake();

	var groups = {};
	for (var n = 0; n < features.length; n++) {
		var feature = features[n];
		var path = svgMake.ConvertGeometry(feature.geometry);

		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		svg.setAttributeNS(null, 'd', path);

		if (feature.id) {
			svg.setAttributeNS(null, 'FID', feature.id);
		}
		if (feature.properties.description) {
			svg.setAttributeNS(null, 'description', feature.properties.description);
		}
		if (feature.properties.value) {
			svg.setAttributeNS(null, 'value', feature.properties.value);
		}
		if (useFillPatterns) {
			svg.setAttributeNS(null, 'style', 'fill: url(#p' + tileUniqueId + '_' + feature.properties.patternClass + ');');
		}
		var className = feature.properties.className;
		var g;
		if (!groups.hasOwnProperty(className)) {
			g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			g.setAttributeNS(null, 'class', className);
			groups[className] = g;
		} else {
			g = groups[className];
		}
		g.appendChild(svg);
	}

	for (var g in groups) {
		if (groups.hasOwnProperty(g)) {
			oSvg.appendChild(groups[g]);
		}
	}

	this.ReplaceMinimizingFlickering(div, oSvg, textureMaskId);

	return oSvg;
};

AbstractSvgComposer.prototype.RescaleStylesAndPatterns = function (svgElem, zoom, previousZoom) {
	var scale = Math.pow(2, previousZoom - zoom);
	// Regenera los estilos para un svg que está reutilizando
	var patternValue = parseInt(this.activeSelectedMetric.GetPattern());

		// NO REDUCIDO
	const TILE_SIZE = 256;
	const TILE_PRJ_SIZE = 8192;
	var GLOBAL_FIT = TILE_PRJ_SIZE / TILE_SIZE;

	svgElem.style.strokeWidth = this.strokeWidthScaling * (this.resolveStrokeWidth(zoom, patternValue) * scale * GLOBAL_FIT) + "px";

	if (this.patternUseFillStyles(patternValue)) {
		var o2 = SVG.adopt(svgElem);
		var labels = this.activeSelectedMetric.GetStyleColorList();
		this.clearPatterns(o2);
		this.appendPatterns(o2, labels, patternValue, zoom, scale);
	}
};

AbstractSvgComposer.prototype.ReplaceMinimizingFlickering = function (div, oSvg, textureMaskId) {
	if (textureMaskId) {
		oSvg.style.position = 'absolute';
		if (div.childNodes.length === 0) {
			div.appendChild(oSvg);
		} else {
			div.insertBefore(oSvg, div.childNodes[0]);
		}
		setTimeout(function () {
			h.removeAllChildrenButOne(div, oSvg);
		}, 50);
	} else {
		if (div.childNodes.length === 0) {
			div.appendChild(oSvg);
		} else {
			div.replaceChild(oSvg, div.childNodes[0]);
		}
	}
};

AbstractSvgComposer.prototype.clearPatterns = function (o2) {
	var defs = o2.defs().node.children;
	for (var n = defs.length - 1; n >= 0; n--) {
		if (defs[n].tagName === 'pattern') {
			defs[n].remove();
		}
	}
};

AbstractSvgComposer.prototype.appendPatterns = function (o2, labels, patternValue, z, expansor) {
	// crea un pattern para cada tipo de etiqueta
	var tileUniqueId = o2.attr('uID');
	for (var l = 0; l < labels.length; l++) {
		var maker = new PatternMaker(patternValue, z, expansor);
		var pattern = maker.CreatePattern(o2);
		pattern.attr('id', 'p' + tileUniqueId + '_' + labels[l].cs);
		if (patternValue === 11) {
			pattern.style('fill: ' + labels[l].fillColor + ';');
		}
		pattern.style('stroke: ' + labels[l].fillColor);
		pattern.style('stroke-opacity: ' + this.activeSelectedMetric.CurrentOpacity());
	}
};

AbstractSvgComposer.prototype.appendSegmentMarkers = function (o2, labels, z, expansor) {
	// crea un svg marker para cada tipo de etiqueta
	var tileUniqueId = o2.attr('uID');
	for (var l = 0; l < labels.length; l++) {
		var maker = new SvgMarkerMaker(z, expansor);
		var pattern = maker.CreateCircleMarker(o2, labels[l].fillColor);
		pattern.attr('id', 'm' + tileUniqueId + '_' + labels[l].cs);
	}
};

AbstractSvgComposer.prototype.appendStyles = function (oSvg, tileUniqueId, labels, patternValue, mask, textureMaskId) {
	// crea una clase para cada tipo de etiqueta
	var styles = "<style type='text/css'>";
	var fillBlock = (patternValue === 1 || patternValue === 2 ? '; fill: transparent ' : '');
	var maskBlock = (mask ? '; mask: url(#' + mask + ')' : '');

	var textureFill = null;
	if (textureMaskId) {
		textureFill = '; fill: url(#' + textureMaskId + ')';
	}

	var strokeOpacity = this.activeSelectedMetric.CurrentOpacity();
	if (patternValue === 0 && textureMaskId) {
		strokeOpacity = 0;
	}
	for (var l = 0; l < labels.length; l++) {
		var currentStyle;

		if (patternValue === 0) {
			// Se fija si el contraste entre el border y la figura va a ser demasiado bajo...
			var fillColor = labels[l].fillColor;
			var colorParts = color.ParseColorParts(fillColor);
			var colorAvg = (colorParts[0] + colorParts[1] + colorParts[2]) / 3;
			var stroke;
			if (colorAvg < 200) {
				stroke = fillColor;
			} else {
				stroke = color.MakeColor(colorParts[0] * .9, colorParts[1] * .9, colorParts[2] * .9);
			}
			fillBlock = '; fill: ' + labels[l].fillColor;
			currentStyle = 'stroke: ' + stroke + '; stroke-opacity: ' + Math.max(1, strokeOpacity * 1.1) +
				maskBlock + (textureFill ? textureFill : fillBlock) + '; fill-opacity: ' + this.activeSelectedMetric.CurrentOpacity();
		} else {
			currentStyle = 'stroke: ' + labels[l].fillColor + '; stroke-opacity: ' +  strokeOpacity +
					(textureFill ? textureFill : fillBlock) + maskBlock;
		}
		if (this.useSvgMarkers) {
			var markers = '; marker-start: url(#m' + tileUniqueId + '_' + labels[l].cs + ')' +
										'; marker-end: url(#m' + tileUniqueId + '_' + labels[l].cs + ')';
			currentStyle += markers;
		}
		var name = 'e' + tileUniqueId + '_' + labels[l].className;
		styles += '.' + name + " { " + currentStyle + " } ";
	}
	styles += '</style>';

	var parseSVG = require('parse-svg');
	var svgStyles = parseSVG(styles);
	oSvg.appendChild(svgStyles);
};


AbstractSvgComposer.prototype.dispose = function () {
	this.clearText();
	this.clearPerimeter();
};

AbstractSvgComposer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);
	this.clearTilePerimeters(tileKey);
	if (this.tileDataCache.hasOwnProperty(tileKey)) {
		delete this.tileDataCache[tileKey];
	}
};
