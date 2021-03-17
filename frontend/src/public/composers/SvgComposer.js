import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import h from '@/public/js/helper';
import str from '@/common/js/str';
import Pattern from '@/public/composers/Pattern';
import Mercator from '@/public/js/Mercator';
import SVG from 'svg.js';

export default SvgComposer;

function SvgComposer(mapsApi, activeSelectedMetric) {
	if (!mapsApi) {
		return;
	}
	// api usada de geojson2svg en js: https://github.com/gagan-bansal/geojson2svg
	// api usada de svg: http://svgjs.com/elements/#svg-pattern
	// posible api de php https://github.com/chrishadi/geojson2svg/blob/master/geojson2svg.php
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.keysInTile = [];
	this.svgInTile = [];
	this.index = this.activeSelectedMetric.index;
	this.labelsVisibility = [];
	this.AbstractConstructor();
	this.useGradients = false;
	this.useTextures = false;
};

SvgComposer.prototype = new AbstractTextComposer();
SvgComposer.uniqueCssId = 1;


SvgComposer.prototype.SVG = function (h, w, z, parentAttributes) {
	var xmlns = 'http://www.w3.org/2000/svg';
	var boxWidth = h;
	var boxHeight = w;

	var svgElem = document.createElementNS(xmlns, 'svg');
	svgElem.setAttributeNS(null, 'width', boxWidth);
	svgElem.setAttributeNS(null, 'height', boxHeight);
	svgElem.setAttributeNS(null, 'isFIDContainer', 1);
	for (var key in parentAttributes) {
    // check if the property/key is defined in the object itself, not in parent
		if (parentAttributes.hasOwnProperty(key)) {
			svgElem.setAttributeNS(null, key, parentAttributes[key]);
    }
	}
	svgElem.style.display = 'block';
	var patternValue = parseInt(this.activeSelectedMetric.GetPattern());
	if (patternValue === 0 || patternValue === 2) {
		svgElem.style.strokeWidth = (z < 16 ? '1.5px' : '2px');
	} else if (patternValue === 1) {
		svgElem.style.strokeWidth = (z < 16 ? '1.5px' : '2px');
	} else if (this.patternIsPipeline(patternValue)) {
		// 3,4,5,6 son cañerías
		svgElem.style.strokeWidth = '0px';
	} else {
		svgElem.style.strokeWidth = (z < 16 ? '1.5px' : '2px');
		svgElem.style.strokeOpacity = this.activeSelectedMetric.SelectedVariable().CurrentOpacity;
	}
	return svgElem;
};

SvgComposer.prototype.patternUseFillStyles = function (patternValue) {
	return (patternValue > 2);
};

SvgComposer.prototype.patternIsPipeline = function (patternValue) {
	return (patternValue >= 3 && patternValue <= 6);
};

SvgComposer.prototype.CreateSVGOverlay = function (tileUniqueId, div, parentAttributes, features, projected,
										tileBounds, z, patternValue, gradient, texture) {
	var m = new Mercator();
	var projectedFeatures;

	var min = m.fromLatLngToPoint({ lat: tileBounds.Min.Lat, lng: tileBounds.Min.Lon });
	var max = m.fromLatLngToPoint({ lat: tileBounds.Max.Lat, lng: tileBounds.Max.Lon });

	if (projected) {
		projectedFeatures = {
			type: 'FeatureCollection',
			features: features
		};
	} else {
		m.min = min;
		m.max = max;
		projectedFeatures = m.ProjectGeoJsonFeatures(features);
	}

	var attributes = [{ property: 'id', type: 'dynamic', key: 'FID' },
		{ property: 'properties.className', type: 'dynamic', key: 'class' },
		{ property: 'properties.description', type: 'dynamic', key: 'description' },
		{ property: 'properties.value', type: 'dynamic', key: 'value' }];

	if (this.patternUseFillStyles(patternValue)) {
		attributes.push({ property: 'properties.style', type: 'dynamic', key: 'style' });
	}
	var options = {
		viewportSize: { width: 256, height: 256 },
		attributes: attributes,
		mapExtent: { left: 0, bottom: 256, right: 256, top: 0 },
		output: 'svg'
	};

	var geojson2svg = require('geojson2svg');
	var converter = geojson2svg(options);
	var parseSVG = require('parse-svg');
	var svgStrings = converter.convert(projectedFeatures, options);

	var oSvg = this.SVG(256, 256, z, parentAttributes);

	var o2 = SVG.adopt(oSvg);

	var scales = this.defineScaleCriteria(z);

	var labels = this.activeSelectedMetric.GetStyleColorList(z);
	if (this.patternUseFillStyles(patternValue)) {
		this.appendPatterns(o2, labels, scales);
	}

	var textureMaskId = null;
	if (this.useTextures && texture && texture.Data) {
		var image = o2.image("data:" + texture.ImageType + ";base64," + texture.Data, 256, 256);
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
			var image = o2.image("data:" + gradient.ImageType + ";base64," + gradient.Data, 256, 256);
			var rect2 = o2.rect(256, 256);
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
	var startTime = performance.now();
	this.appendStyles(oSvg, tileUniqueId, labels, patternValue, maskId, textureMaskId);

	for (var n = 0; n < svgStrings.length; n++) {
		var svgStr = svgStrings[n];
		var svg = null;
		if (svgStr.startsWith('<path ')) {
			svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			var parts = svgStr.split('"');
			for (var i = 0; i < parts.length; i += 2) {
				var key = parts[i].substring(parts[i].indexOf(' ') + 1, parts[i].lastIndexOf('='));
				if (key) {
					svg.setAttributeNS(null, key, parts[i + 1]);
				}
			}
		} else {
			svg = parseSVG(svgStr);
		}
		oSvg.appendChild(svg);
	}

	this.ReplaceMinimizingFlickering(div, oSvg, textureMaskId);

	return oSvg;
};

SvgComposer.prototype.ReplaceMinimizingFlickering = function (div, oSvg, textureMaskId) {
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


SvgComposer.prototype.appendPatterns = function (o2, labels, scales) {
	// crea un pattern para cada tipo de etiqueta
	var patternValue = parseInt(this.activeSelectedMetric.GetPattern());
	var width = (this.patternIsPipeline(patternValue) ? '; stroke-width: ' + scales.ang + 'px;' : '');
	for (var l = 0; l < labels.length; l++) {
		var pattern = this.createPattern(o2, scales);
		pattern.attr('id', labels[l].cs);
		if (patternValue === 11) {
			pattern.style('fill: ' + labels[l].fillColor + ';');
		}
		pattern.style('stroke: ' + labels[l].fillColor + '; stroke-opacity: ' + this.activeSelectedMetric.CurrentOpacity + width);
	}
};

SvgComposer.prototype.appendStyles = function (oSvg, tileUniqueId, labels, patternValue, mask, textureMaskId) {
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
		if (patternValue === 0) {
			// Se fija si el contraste entre el border y la figura va a ser demasiado bajo...
			var color = labels[l].fillColor;
			var colorParts = str.ParseColorParts(color);
			var colorAvg = (colorParts[0] + colorParts[1] + colorParts[2]) / 3;
			var stroke;
			if (colorAvg < 200) {
				stroke = color;
			} else {
				stroke = str.MakeColor(colorParts[0] * .9, colorParts[1] * .9, colorParts[2] * .9);
			}
			fillBlock = '; fill: ' + labels[l].fillColor;
			styles += '.e' + tileUniqueId + '_' + labels[l].className +
				' { stroke: ' + stroke + '; stroke-opacity: ' + Math.max(1, strokeOpacity * 1.1) +
				maskBlock + (textureFill ? textureFill : fillBlock) + '; fill-opacity: ' + this.activeSelectedMetric.CurrentOpacity + ' } ';
		} else {
			styles += '.e' + tileUniqueId + '_' + labels[l].className +
				' { stroke: ' + labels[l].fillColor + '; stroke-opacity: ' +  strokeOpacity +
					(textureFill ? textureFill : fillBlock) + maskBlock + ' } ';
		}
	}
	styles += '</style>';

	var parseSVG = require('parse-svg');
	var svgStyles = parseSVG(styles);
	oSvg.appendChild(svgStyles);
};

SvgComposer.prototype.createPattern = function (o2, scale) {
	var pattern = new Pattern(this.activeSelectedMetric.GetPattern(), scale);
	return pattern.GetPattern(o2);
};

SvgComposer.prototype.dispose = function () {
	this.clearText();
};

SvgComposer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);
	if (this.svgInTile.hasOwnProperty(tileKey)) {
		delete this.svgInTile[tileKey];
	}
};

SvgComposer.prototype.defineScaleCriteria = function(z) {
	var divi = 4;
	switch (z) {
	case 11:
	case 12:
		divi = 2;
		break;
	case 13:
	case 14:
		divi = 1;
		break;
	case 15:
	case 16:
		divi = 0.5;
		break;
	case 17:
		divi = 0.25;
		break;
	case 18:
	case 19:
	case 20:
	case 21:
		divi = 0.125;
		break;
	}
	var v4 = 128 / divi;
	var v3 = 96 / divi;
	var v2 = 64 / divi;
	var v1 = 32 / divi;

	var anc = 4;
	var ang = 2;
	if (divi === 2) {
		anc = 3;
		ang = 1;
	}
	if (divi < 1) {
		anc = 3 / divi;
		ang = 1 / divi;
	}
	if (z <= 10) {
		ang = 1;
		anc = ang;
	}
	if (z >= 17) {
		anc = ang;
	}
	return { v1: v1, v2: v2, v3: v3, v4: v4, anc, ang, divi };
};
