import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import h from '@/public/js/helper';
import str from '@/common/framework/str';
import color from '@/common/framework/color';
import PatternMaker from '@/public/composers/PatternMaker';
import Mercator from '@/public/js/Mercator';
import SvgMake from './SvgMake';
import SVG from 'svg.js';
import html2canvas from 'html2canvas';
import canvg from 'canvg';

export default AbstractSvgComposerRawer;

function AbstractSvgComposerRawer(mapsApi, activeSelectedMetric) {
	if (!mapsApi) {
		return;
	}
	// api usada de geojson2svg en js: https://github.com/gagan-bansal/geojson2svg
	// api usada de svg: http://svgjs.com/elements/#svg-pattern
	// posible api de php https://github.com/chrishadi/geojson2svg/blob/master/geojson2svg.php
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.keysInTile = [];
	this.tileDataCache = [];
	this.index = this.activeSelectedMetric.index;
	this.labelsVisibility = [];
	this.AbstractConstructor();
	this.useGradients = false;
	this.useTextures = false;
	this.svgStyles = {};
};

AbstractSvgComposerRawer.prototype = new AbstractTextComposer();
AbstractSvgComposerRawer.uniqueCssId = 1;


AbstractSvgComposerRawer.prototype.CreateSVG = function (h, w, z, patternValue, tileUniqueId, parentAttributes) {
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

	this.svgStyles = {};

	for (var key in parentAttributes) {
    // check if the property/key is defined in the object itself, not in parent
		if (parentAttributes.hasOwnProperty(key)) {
			svgElem.setAttributeNS(null, key, parentAttributes[key]);
    }
	}
	svgElem.style.display = 'block';
	svgElem.style.strokeWidth = this.resolveStrokeWidth(z, patternValue) * scale + "px";

	this.svgStyles['root'] = { 'stroke-width': svgElem.style.strokeWidth };

	if (patternValue > 6) {
		svgElem.style.strokeOpacity = this.activeSelectedMetric.SelectedVariable().CurrentOpacity;
		this.svgStyles['root']['stroke-opacity'] = svgElem.style.strokeOpacity;
	}

	return svgElem;
};
AbstractSvgComposerRawer.prototype.resolveStrokeWidth = function (z, patternValue) {
	if (patternValue === 1) {
		var width = (z < 16 ? 1.5 : 2);
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
	return (z < 16 ? 1.5 : 2);
};

AbstractSvgComposerRawer.prototype.patternUseFillStyles = function (patternValue) {
	return (patternValue > 2);
};

AbstractSvgComposerRawer.prototype.patternIsPipeline = function (patternValue) {
	return (patternValue >= 3 && patternValue <= 6);
};

AbstractSvgComposerRawer.prototype.CreateSVGOverlay = function (tileUniqueId, div, parentAttributes, features, projected,
	tileBounds, z, patternValue, gradient, texture) {
	var projectedFeatures;

	if (projected) {
		projectedFeatures = {
			type: 'FeatureCollection',
			features: features
		};
	} else {
		var m = new Mercator();
		var min = m.fromLatLngToPoint({ lat: tileBounds.Min.Lat, lng: tileBounds.Min.Lon });
		var max = m.fromLatLngToPoint({ lat: tileBounds.Max.Lat, lng: tileBounds.Max.Lon });
		m.min = min;
		m.max = max;
		projectedFeatures = m.ProjectGeoJsonFeatures(features);
	}
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
	var svgMake = new SvgMake();

	var groups = {};
	for (var n = 0; n < projectedFeatures.features.length; n++) {
		var feature = projectedFeatures.features[n];
		var path = svgMake.ConvertGeometry(feature.geometry);

		var className = feature.properties.className;
		var g;
		if (!groups.hasOwnProperty(className)) {
			g = [];
			groups[className] = g;
		} else {
			g = groups[className];
		}
		var fill = '';
		if (useFillPatterns) {
			fill = 'fill="url(#p' + tileUniqueId + '_' + feature.properties.patternClass + ')" ';
		}
		g.push('<path ' + fill + 'd="' + path + '"/>');

		/*
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		svg.setAttributeNS(null, 'd', path);

		svg.setAttributeNS(null, 'FID', feature.id);
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
		*/
	}
	var svgPaths = '';
	for (var g in groups) {
		if (groups.hasOwnProperty(g)) {
			//oSvg.appendChild(groups[g]);
			svgPaths += '<g ' + this.stylesToText(g) + '>' +
											groups[g].join('') + '</g>';
		}
	}

	//this.ReplaceMinimizingFlickering(div, oSvg, textureMaskId);
	// Lo pone en un canvas
	var loc = this;
	/*
			var canvas = document.getElementById("canvas");
			var ctx = canvas.getContext("2d");
			var svg = "data:image/svg+xml," + oSvg.outerHTML.replace('"', "'");*/
	/*
					"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>",
							"<foreignObject width='100%' height='100%'>",
									"<div xmlns='http://www.w3.org/1999/xhtml' style='font-size:40px'>",
											"<em>I</em> like <span style='color:white; text-shadow:0 0 2px blue;'>cheese</span>",
									"</div>",
							"</foreignObject>",
					"</svg>"
			].join("");
			*/
/*			var img = new Image();
			img.src = svg;
			img.onload = function () {
					ctx.drawImage(img, 0, 0);
			};*/
	  //var canvas = document.getElementById("canvas");
	var rootStyles = this.stylesToText('root');
	var svgInline = "data:image/svg+xml;utf8,";
	var svgBase = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 8192 8192" height="256px" width="256px" ' + rootStyles + '>';
	var imgSrc = svgInline + svgBase + svgPaths + "</svg>";
	var img = new Image();
	img.src = imgSrc;
//	var canvas = this.SvgToCanvas(oSvg);

	this.ReplaceMinimizingFlickering(div, img, textureMaskId);

	return oSvg;
};

AbstractSvgComposerRawer.prototype.stylesToText = function (key) {
	var set = this.svgStyles[key];
	var ret = "";
	for (var s in set) {
		if (set.hasOwnProperty(s)) {
			var v = set[s];
			if (v[0] == '#') {
				v = 'rgb(' + this.hexToRgb(v.substring(1)) + ')';
			}
			ret += s + '="' + v + '" ';
		}
	}
	return ret;
};


AbstractSvgComposerRawer.prototype.hexToRgb = function (hex) {
	var bigint = parseInt(hex, 16);
	var r = (bigint >> 16) & 255;
	var g = (bigint >> 8) & 255;
	var b = bigint & 255;

	return r + "," + g + "," + b;
};

AbstractSvgComposerRawer.prototype.styleStringToKeyValue = function (stylesText) {
	var styles = stylesText.split(';');
	var ret = {};
	for (var n = 0; n < styles.length; n++) {
		var parts = styles[n].split(':');
		ret[parts[0].trim()] = parts[1].trim();
	}
	return ret;
};


AbstractSvgComposerRawer.prototype.SvgToCanvas = function (oSvg) {
	var canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	const ctx = canvas.getContext('2d');
	var svgWider = oSvg.outerHTML;
	var startTime, endTime;
	startTime = performance.now();
	var v = canvg.fromString(ctx, svgWider);
	v.render().then(function () {
		endTime = performance.now();
		console.log('done in ' + (endTime - startTime));
	});
	return canvas;
};

AbstractSvgComposerRawer.prototype.SaveTileData = function (svg, x, y, z) {
	var localTileKey = this.GetTileCacheKey(x, y, z);
	if (localTileKey) {
		this.tileDataCache[localTileKey] = svg;
	}
};

AbstractSvgComposerRawer.prototype.RescaleStylesAndPatterns = function (svgElem, zoom, previousZoom) {
	var scale = Math.pow(2, previousZoom - zoom);
	// Regenera los estilos para un svg que está reutilizando
	var patternValue = parseInt(this.activeSelectedMetric.GetPattern());

		// NO REDUCIDO
	const TILE_SIZE = 256;
	const TILE_PRJ_SIZE = 8192;
	var GLOBAL_FIT = TILE_PRJ_SIZE / TILE_SIZE;

	svgElem.style.strokeWidth = (this.resolveStrokeWidth(zoom, patternValue) * scale * GLOBAL_FIT) + "px";

	if (this.patternUseFillStyles(patternValue)) {
		var o2 = SVG.adopt(svgElem);
		var labels = this.activeSelectedMetric.GetStyleColorList();
		this.clearPatterns(o2);
		this.appendPatterns(o2, labels, patternValue, zoom, scale);
	}
};

AbstractSvgComposerRawer.prototype.ReplaceMinimizingFlickering = function (div, oSvg, textureMaskId) {
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

AbstractSvgComposerRawer.prototype.clearPatterns = function (o2) {
	var defs = o2.defs().node.children;
	for (var n = defs.length - 1; n >= 0; n--) {
		if (defs[n].tagName === 'pattern') {
			defs[n].remove();
		}
	}
};

AbstractSvgComposerRawer.prototype.appendPatterns = function (o2, labels, patternValue, z, expansor) {
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

AbstractSvgComposerRawer.prototype.appendStyles = function (oSvg, tileUniqueId, labels, patternValue, mask, textureMaskId) {
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
		var currentStyle = '';
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
			currentStyle += 'stroke: ' + stroke + '; stroke-opacity: ' + Math.max(1, strokeOpacity * 1.1) +
				maskBlock + (textureFill ? textureFill : fillBlock) + '; fill-opacity: ' + this.activeSelectedMetric.CurrentOpacity();
		} else {
			currentStyle += 'stroke: ' + labels[l].fillColor + '; stroke-opacity: ' +  strokeOpacity +
					(textureFill ? textureFill : fillBlock) + maskBlock;
		}
		var name = 'e' + tileUniqueId + '_' + labels[l].className;
		styles += '.' + name + " { " + currentStyle + " } ";
		this.svgStyles[name] = this.styleStringToKeyValue(currentStyle);
	}
	styles += '</style>';

	var parseSVG = require('parse-svg');
	var svgStyles = parseSVG(styles);
	oSvg.appendChild(svgStyles);
};


AbstractSvgComposerRawer.prototype.dispose = function () {
	this.clearText();
};

AbstractSvgComposerRawer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);
	if (this.tileDataCache.hasOwnProperty(tileKey)) {
		delete this.tileDataCache[tileKey];
	}
};
