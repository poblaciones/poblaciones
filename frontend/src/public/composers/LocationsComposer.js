import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import Svg from '@/public/js/svg';
import h from '@/public/js/helper';
import arr from '@/common/js/arr';
import SequenceComposer from './SequenceComposer';
import fontAwesomeIconsList from '@/common/js/fontAwesomeIconsList.js';
import flatIconsList from '@/common/js/flatIconsList.js';

export default LocationsComposer;

function LocationsComposer(mapsApi, activeSelectedMetric) {
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.styles = [];
	this.keysInTile = {};
	this.labelsVisibility = [];
	this.iconsCache = {};
	this.index = this.activeSelectedMetric.index;
	this.zIndex = (1000 - this.index) * 100;
	if (this.activeSelectedMetric.HasSelectedVariable()) {
		this.variable = this.activeSelectedMetric.SelectedVariable();
	} else {
		this.variable = null;
	}
	this.SequenceComposer = new SequenceComposer(mapsApi, this, activeSelectedMetric);
	this.AbstractConstructor();
};

LocationsComposer.prototype = new AbstractTextComposer();

LocationsComposer.prototype.render = function (mapResults, dataResults, gradient, tileKey, div, x, y, z, tileBounds) {
	var allKeys = [];
	var dataItems = dataResults.Data;
	if (this.variable === null) {
		return;
	}
	var variable = this.variable;
	var variableId = variable.Id;
	var id;
	var varId;
	this.UpdateTextStyle(z);
	var colorMap = this.activeSelectedMetric.GetStyleColorDictionary();

	if (this.keysInTile.hasOwnProperty(tileKey) === false) {
		this.keysInTile[tileKey] = [];
	}

	var markerSettings = this.activeSelectedMetric.SelectedLevel().Dataset.Marker;

	for (var i = 0; i < dataItems.length; i++) {
		var dataElement = dataItems[i];
		varId = dataElement['VariableId'];
		if (varId === variableId) {
			id = dataElement['FID'];

			var val = dataElement['ValueId'];
			var valKey = 'K' + val;
			if (!(valKey in this.labelsVisibility)) {
				this.labelsVisibility[valKey] = this.activeSelectedMetric.ResolveVisibility(val);
			}
			if (this.labelsVisibility[valKey]) {
				var mapItem = [];
				mapItem.id = dataElement['FID'];

				mapItem.lat = dataElement['Lat'];
				mapItem.lon = dataElement['Lon'];

				mapItem.LabelId = val;
				if (variable.ShowValues == 1) {
					mapItem.Value = dataElement['Value'];
				}
				if (dataElement['Description']) {
					mapItem.Description = dataElement['Description'];
				}
				if (dataElement['Symbol']) {
					mapItem.Symbol = dataElement['Symbol'];
				}
				if (dataElement['Sequence']) {
					mapItem.Sequence = dataElement['Sequence'];
				}
				if (! variable.IsSimpleCount) {
					mapItem.Value = this.FormatValue(variable, dataElement);
				}

				// Pone el texto
				// this.AddFeatureText(variable, val, dataElement, tileKey, tileBounds, colorMap);

				allKeys.push(id);

				var marker = this.createMarker(tileKey, mapItem, markerSettings);
				if (variable.IsSequence) {
					this.SequenceComposer.registerSequenceMarker(tileKey, mapItem, marker, z);
				}
			}
		}
	}
};

LocationsComposer.prototype.AddFeatureText = function (variable, val, dataElement, tileKey, tileBounds, colorMap) {
	if (this.activeSelectedMetric.showText() === false) {
		return;
	}
	var location = new this.MapsApi.google.maps.LatLng(parseFloat(dataElement['Lat']), parseFloat(dataElement['Lon']));

	if (this.inTile(tileBounds, location)) {
		this.ResolveValueLabel(variable, dataElement, location, tileKey, colorMap[val]);
	}
};

LocationsComposer.prototype.createMarker = function (tileKey, feature, markerSettings) {
	var loc = this;
	var metric = loc.activeSelectedMetric;
	var variable = this.variable;
	var labelId = feature.LabelId;
	var keyLabel = 'L' + labelId;

	var style;
	if (keyLabel in loc.styles) {
		style = loc.styles[keyLabel];
	} else {
		style = metric.ResolveStyle(variable, labelId);
		loc.styles[keyLabel] = style;
	}
	var geo = new loc.MapsApi.google.maps.LatLng(feature.lat, feature.lon);
	var isSequenceInactiveStep = variable.IsSequence && metric.GetActiveSequenceStep(variable.Id, labelId) !== feature.Sequence;
	var z = window.SegMap.frame.Zoom;
	var params = {};
	var element;

	params.map = loc.MapsApi.gMap;
	params.position = geo;
	params.optimized = false;
	params.zIndex = this.zIndex + (isSequenceInactiveStep ? 5 : 10);

	var scale = this.CalculateMarkerScale(markerSettings, z);
	if (isSequenceInactiveStep) {
		var sequenceMarker = {
			Frame: 'C', Size: markerSettings.Size, AutoScale: markerSettings.AutoScale, Type: 'T',
			Source: 'F', Text: '' + feature.Sequence, NoDescription: true
		};
		var seqScale = scale * .6;
		if (seqScale > 1) {
			seqScale = 1;
		}
		params.icon = this.CreateIcon(sequenceMarker, style, seqScale);
		params.icon.anchor = new this.MapsApi.google.maps.Point(0, 0);
		params.label = this.CreateMarkerContent(metric, sequenceMarker, seqScale);
	} else {
		params.icon = this.CreateIcon(markerSettings, style, scale);
		params.label = this.CreateMarkerContent(metric, markerSettings, scale, feature.Symbol);
	}
	// Listo, lo muestra...
	element = new loc.MapsApi.google.maps.Marker(params);
	this.addMarkerListeners(metric, element, feature, z);

	if (loc.keysInTile.hasOwnProperty(tileKey) === false) {
		loc.keysInTile[tileKey] = [];
	}
	loc.keysInTile[tileKey].push(element);
	// Crea el pseudo-marker con la descripción
	if (feature.Description && ! isSequenceInactiveStep) {
		var descriptionMarker = this.createDescriptionMarker(geo, feature.Description, markerSettings, scale, params.zIndex + 50);
		loc.keysInTile[tileKey].push(descriptionMarker);
		element.extraMarker = descriptionMarker;
	}
	return element;
};


LocationsComposer.prototype.destroyMarker = function (tileKey, marker) {
	marker.setMap(null);
	var tileItems = this.keysInTile[tileKey];
	if (tileItems) {
		arr.Remove(tileItems, marker);
	}
	if (marker.extraMarker) {
		this.destroyMarker(tileKey, marker.extraMarker);
	}
};

LocationsComposer.prototype.createDescriptionMarker = function (location, description, marker, scale, zIndex) {
	var fontScale = (10 * scale);
	if (scale < 1.5)
		fontScale *= 1.1;
	var topOffset;
	if (marker.DescriptionVerticalAlignment == 'T') {
		topOffset = -(marker.Frame == 'P' ? 40 : 32) * scale;
	} else if (marker.DescriptionVerticalAlignment == 'B') {
		topOffset = 12;
		if (scale < 1)
			topOffset *=  0.6;
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

LocationsComposer.prototype.CreateIcon = function (marker, style, scale) {
	var icon = this.objectClone(style);
	icon.strokeColor = 'white';
	icon.fillOpacity = 1;
	switch (marker.Frame) {
		case 'P':
			icon.path = Svg.markerPinche;
			icon.labelOrigin = new this.MapsApi.google.maps.Point(11.5, 11);
			icon.anchor = new this.MapsApi.google.maps.Point(10.5, 32);
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

		//		icon.anchor = new this.MapsApi.google.maps.Point(0, 1);
//			scale *= 12;
			break;
		default:
			throw new Error('Tipo de marco no reconocido.');
	}
	icon.scale = scale;
	return icon;
};

LocationsComposer.prototype.CreateMarkerContent = function (metric, marker, scale, symbol) {
	if (marker.Type == 'N') {
		return null;
	}
	// Si tiene un contenido...
	var content;
	if (marker.Source === 'V') {
		content = symbol;
	} else {
		if (marker.Type == 'I') {
			content = marker.Symbol;
		} else {
			content = marker.Text;
		}
	}
	var symbol;
	if (marker.Type == 'I') {
		symbol = this.formatIcon(content);
	} else if (marker.Type == 'T') {
		symbol = this.formatText(content);
	} else {
		throw new Error('Tipo de marcador no reconocido.');
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

LocationsComposer.prototype.formatText = function (content) {
	return { weight: '400', unicode: content };
};

LocationsComposer.prototype.formatIcon = function (symbol) {
	var cached = this.iconsCache[symbol];
	if (cached) {
		return cached;
	}
	var ret = { 'family': 'Arial', 'unicode': ' ', 'weight': '400' };
	if (symbol !== null && symbol !== undefined && symbol !== '') {
		var preffix = symbol.substr(0, 3);
		var unicode = null;
		if (preffix === 'fab' || preffix === 'fas') {
			unicode = fontAwesomeIconsList.icons[symbol];
		} else if (preffix === 'fla') {
			unicode = flatIconsList.icons[symbol];
		}
		var family;
		var weight = 'normal';
		switch (preffix) {
			case 'fab':
				family = 'Font Awesome\\ 5 Brands';
				weight = '400';
				break;
			case 'fas':
				family = 'Font Awesome\\ 5 Free';
				weight = '900';
				break;
			case 'fla':
				family = 'Flaticon';
				break;
			default:
				family = '';
				break;
		}
		if (unicode) {
			ret = { 'family': family, 'unicode': unicode, 'weight': weight };
		}
	}
	this.iconsCache[symbol] = ret;;
	return ret;
};

LocationsComposer.prototype.CalculateMarkerScale = function (marker, z) {
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

LocationsComposer.prototype.addMarkerListeners = function (metric, element, feature, z) {
	var loc = this;
	if (loc.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo) {
		element.addListener('click', function (e) {
			var parentInfo = {
				MetricId: metric.properties.Metric.Id,
				MetricVersionId: metric.SelectedVersion().Version.Id,
				LevelId: metric.SelectedLevel().Id,
				VariableId: loc.variable.Id
			};
			if (loc.variable.IsSequence) {
				parentInfo.LabelId = feature.LabelId;
				parentInfo.Sequence = feature.Sequence;
			}
			loc.MapsApi.markerClicked(e, parentInfo, feature.id,
				new loc.MapsApi.google.maps.Size(0, -1 * h.getScaleFactor(z)));
		});
	} else {
		element.clickable = false;
	}
	element.addListener('mouseover', function (e) {
		var parentInfo = {
			MetricId: metric.properties.Metric.Id,
			MetricVersionId: metric.SelectedVersion().Version.Id,
			LevelId: metric.SelectedLevel().Id,
			VariableId: loc.variable.Id
		};
		loc.MapsApi.selector.markerMouseOver(e, parentInfo, feature.id,
			feature.Description,
			feature.Value);
	});
	element.addListener('mouseout', function (e) {
		var parentInfo = {
			MetricId: metric.properties.Metric.Id,
			MetricVersionId: metric.SelectedVersion().Version.Id,
			LevelId: metric.SelectedLevel().Id,
			VariableId: loc.variable.Id
		};
		loc.MapsApi.selector.markerMouseOut(e, parentInfo, feature.id,
			new loc.MapsApi.google.maps.Size(0, -1 * h.getScaleFactor(z)));
	});
};

LocationsComposer.prototype.objectClone = function (obj) {
	if (obj === null || typeof obj !== 'object') return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
};

LocationsComposer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);

	var items = this.keysInTile[tileKey];
	if (items) {
		this.SequenceComposer.removeTileSequenceMarker(tileKey);
		for (var i = 0; i < items.length; i++) {
			items[i].setMap(null);
		}
	}
	this.keysInTile[tileKey] = [];
	delete this.keysInTile[tileKey];
};

LocationsComposer.prototype.dispose = function () {
	for (var k in this.keysInTile) {
		if (this.keysInTile.hasOwnProperty(k)) {
			this.removeTileFeatures(k);
		}
	}
	this.clearText();
};
