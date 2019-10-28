import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import Helper from '@/public/js/helper';
import Pattern from '@/public/composers/Pattern';
import SvgOverlay from '@/public/googleMaps/SvgOverlay';
import Mercator from '@/public/js/Mercator';
import SVG from 'svg.js';

export default SvgFullGeojsonComposer;

function SvgFullGeojsonComposer(mapsApi, activeSelectedMetric) {
	// api usada de geojson2svg en js: https://github.com/gagan-bansal/geojson2svg
	// api usada de svg: http://svgjs.com/elements/#svg-pattern
	// posible api de php https://github.com/chrishadi/geojson2svg/blob/master/geojson2svg.php
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.keysInTile = [];
	this.styles = [];
	this.useOverlaySvg = false;
	this.svgInTile = [];
	this.index = this.activeSelectedMetric.index;
	this.labelsVisibility = [];
	this.AbstractConstructor();
};
SvgFullGeojsonComposer.prototype = new AbstractTextComposer();

SvgFullGeojsonComposer.prototype.SVG = function (h, w, z) {
	var xmlns = 'http://www.w3.org/2000/svg';
	var boxWidth = h;
	var boxHeight = w;

	var svgElem = document.createElementNS(xmlns, 'svg');
	svgElem.setAttributeNS(null, 'width', boxWidth);
	svgElem.setAttributeNS(null, 'height', boxHeight);
	svgElem.setAttributeNS(null, 'isFIDContainer', 1);
	svgElem.setAttributeNS(null, 'metricName', this.activeSelectedMetric.properties.Metric.Name);
	svgElem.setAttributeNS(null, 'metricId', this.activeSelectedMetric.properties.Metric.Id);
	svgElem.setAttributeNS(null, 'metricVersionId', this.activeSelectedMetric.SelectedVersion().Version.Id);
	svgElem.setAttributeNS(null, 'levelId', this.activeSelectedMetric.SelectedLevel().Id);
	svgElem.setAttributeNS(null, 'variableId', this.activeSelectedMetric.SelectedVariable().Id);
	svgElem.style.display = 'block';
	var patternValue = parseInt(this.activeSelectedMetric.GetPattern());
	if (patternValue === 0 || patternValue === 2) {
		svgElem.style.strokeWidth = (z < 16 ? '1.5px' : '2px');
	} else if (patternValue === 1) {
		svgElem.style.strokeWidth = (z < 16 ? '2.5px' : '4px');
	} else if (this.patternIsPipeline(patternValue)) {
		// 3,4,5,6 son cañerías
		svgElem.style.strokeWidth = '0px';
	} else {
		svgElem.style.strokeWidth = (z < 16 ? '1.5px' : '2px');
		svgElem.style.strokeOpacity = this.activeSelectedMetric.currentOpacity;
	}
	return svgElem;
};

SvgFullGeojsonComposer.prototype.renderGeoJson = function (dataMetric, mapResults, dataResults, tileKey, div, x, y, z, tileBounds) {
	var filtered = [];
	var allKeys = [];
	var mapItems = mapResults.Data.features;
	var projected = mapResults.Data.projected;
	var dataItems = dataResults.Data;
	if (this.activeSelectedMetric.HasSelectedVariable() === false) {
		return { 'type': 'FeatureCollection', 'features': [] };
	}
	var variableId = this.activeSelectedMetric.SelectedVariable().Id;
	var patternValue = parseInt(this.activeSelectedMetric.GetPattern());
	var id;
	var varId;
	var iMapa = 0;
	this.UpdateTextStyle(z);
	var colorMap = this.activeSelectedMetric.GetStyleColorDictionary();
	this.styles = [];

	if (mapItems.length === 0) return;

	for (var i = 0; i < dataItems.length; i++) {
		varId = dataItems[i]['VariableId'];
		if (varId === variableId) {
			id = dataItems[i]['FID'];
			var fid = parseFloat(id);
			// avanza en mapa
			while (mapItems[iMapa].id < fid) {
				if (++iMapa === mapItems.length) {
					break;
				}
			}
			if (iMapa === mapItems.length) {
				break;
			}
			if (mapItems[iMapa].id == fid) {
				this.processFeature(id, dataItems[i], mapItems[iMapa], tileKey, tileBounds, filtered, allKeys, patternValue, colorMap);
			}
		}
	}
	this.keysInTile[tileKey] = allKeys;
	var svg = this.CreateSVGOverlay(div, filtered, projected, tileBounds, z, patternValue);

	if (svg !== null) {
		this.svgInTile[tileKey] = svg;
	}
	return { 'type': 'FeatureCollection', 'features': [] };
};

SvgFullGeojsonComposer.prototype.bindStyles = function (dataMetric, tileKey) {
};

SvgFullGeojsonComposer.prototype.processFeature = function (id, dataElement, mapElement, tileKey, tileBounds, filtered, allKeys, patternValue, colorMap) {
	// Se fija si por etiqueta está visible
	var val = dataElement['ValueId'];
	var valKey = 'K' + val;
	if (!(valKey in this.labelsVisibility)) {
		this.labelsVisibility[valKey] = this.activeSelectedMetric.ResolveVisibility(val);
	}
	if (this.labelsVisibility[valKey] === false) {
		return;
	}

	// Lo agrega
	var mapItem = {
		id: mapElement.id, type: mapElement.type, geometry: mapElement.geometry, properties: { className: 'c' + val } };

	if (this.patternUseFillStyles(patternValue)) {
		mapItem.properties.style = 'fill: url(#cs' + val + ');';
	}

	this.AddFeatureText(val, mapElement, dataElement, tileKey, tileBounds, colorMap);

	filtered.push(mapItem);
};

SvgFullGeojsonComposer.prototype.AddFeatureText = function (val, mapElement, dataElement, tileKey, tileBounds, colorMap) {
	if (this.activeSelectedMetric.showText() === false) {
		return;
	}
	var location;
	if (mapElement['properties'] && mapElement['properties'].centroid) {
		location = new window.google.maps.LatLng(mapElement['properties'].centroid[0], mapElement['properties'].centroid[1]);
	} else {
		location = Helper.getGeojsonCenter(mapElement);
	}
	if (this.inTile(tileBounds, location)) {
		this.ResolveValueLabel(dataElement, location, tileKey, colorMap[val]);
	}
};

SvgFullGeojsonComposer.prototype.patternUseFillStyles = function (patternValue) {
	return (patternValue > 2);
};

SvgFullGeojsonComposer.prototype.patternIsPipeline = function (patternValue) {
	return (patternValue >= 3 && patternValue <= 6);
};

SvgFullGeojsonComposer.prototype.CreateSVGOverlay = function (div, features, projected, tileBounds, z, patternValue) {
	var m = new Mercator();
	var projectedFeatures;
	if (projected) {
		projectedFeatures = {
			type: 'FeatureCollection',
			features: features
		};
	} else {
		projectedFeatures = m.ProjectGeoJsonFeatures(features);
	}

	var mercator = new Mercator();
	var min = mercator.fromLatLngToPoint({ lat: tileBounds.Min.Lat, lng: tileBounds.Min.Lon });
	var max = mercator.fromLatLngToPoint({ lat: tileBounds.Max.Lat, lng: tileBounds.Max.Lon });

	var attributes = [{ property: 'id', type: 'dynamic', key: 'FID' },
		{ property: 'properties.className', type: 'dynamic', key: 'class' }];

	if (this.patternUseFillStyles(patternValue)) {
		attributes.push({ property: 'properties.style', type: 'dynamic', key: 'style' });
	}
	var options = {
		viewportSize: { width: 256, height: 256 },
		attributes: attributes,
		mapExtent: { left: min.x, bottom: -max.y, right: max.x, top: -min.y },
		output: 'svg'
	};

	var geojson2svg = require('geojson2svg');
	var converter = geojson2svg(options);
	var parseSVG = require('parse-svg');
	var svgStrings = converter.convert(projectedFeatures, options);

	var oSvg = this.SVG(256, 256, z);

	var o2 = SVG.adopt(oSvg);

	var scales = this.defineScaleCriteria(z);

	var labels = this.activeSelectedMetric.GetStyleColorList(z);
	if (this.patternUseFillStyles(patternValue)) {
		this.appendPatterns(o2, labels, scales);
	}
	this.appendStyles(oSvg, labels, patternValue);

	svgStrings.forEach(function (svgStr) {
		var svg = parseSVG(svgStr);
		oSvg.appendChild(svg);
	});


	if (this.useOverlaySvg) {
		var SVGsOverlay = new SvgOverlay(this.MapsApi.gMap, oSvg, 1000 - this.activeSelectedMetric.index, tileBounds);
		return SVGsOverlay;
	} else {
		div.appendChild(oSvg);
		return null;
	}
};

SvgFullGeojsonComposer.prototype.appendPatterns = function (o2, labels, scales) {
	// crea un pattern para cada tipo de etiqueta
	var patternValue = parseInt(this.activeSelectedMetric.GetPattern());
	var width = (this.patternIsPipeline(patternValue) ? '; stroke-width: ' + scales.ang + 'px;' : '');
	for (var l = 0; l < labels.length; l++) {
		var pattern = this.createPattern(o2, scales);
		pattern.attr('id', labels[l].cs);
		if (patternValue === 11) {
			pattern.style('fill: ' + labels[l].fillColor + ';');
		}
		pattern.style('stroke: ' + labels[l].fillColor + '; stroke-opacity: ' + this.activeSelectedMetric.currentOpacity + width);
	}
};

SvgFullGeojsonComposer.prototype.appendStyles = function (oSvg, labels, patternValue) {
	// crea una clase para cada tipo de etiqueta
	var styles = "<style type='text/css'>";
	var fill = '';
	if (patternValue === 1 || patternValue === 2) {
		fill = '; fill: transparent ';
	}
	for (var l = 0; l < labels.length; l++) {
		if (patternValue === 0) {
			styles += '.' + labels[l].className +
				' { stroke: ' + labels[l].fillColor + '; stroke-opacity: ' + (this.activeSelectedMetric.currentOpacity * 1.1) + '; ' +
				' fill: ' + labels[l].fillColor + '; fill-opacity: ' + this.activeSelectedMetric.currentOpacity + ' } ';
		} else {
			styles += '.' + labels[l].className +
				' { stroke: ' + labels[l].fillColor + '; stroke-opacity: ' + this.activeSelectedMetric.currentOpacity + fill + ' } ';
		}
	}
	styles += '</style>';

	var parseSVG = require('parse-svg');
	var svgStyles = parseSVG(styles);
	oSvg.appendChild(svgStyles);
};

SvgFullGeojsonComposer.prototype.createPattern = function (o2, scale) {
	var pattern = new Pattern(this.activeSelectedMetric.GetPattern(), scale);
	return pattern.GetPattern(o2);
};

SvgFullGeojsonComposer.prototype.clear = function () {
	this.clearText();
};

SvgFullGeojsonComposer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);
	if (this.svgInTile.hasOwnProperty(tileKey)) {
		this.svgInTile[tileKey].Release();
		delete this.svgInTile[tileKey];
	}
};

SvgFullGeojsonComposer.prototype.defineScaleCriteria = function(z) {
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
