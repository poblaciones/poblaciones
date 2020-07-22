import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import Svg from '@/public/js/svg';
import h from '@/public/js/helper';

export default LocationsComposer;

function LocationsComposer(mapsApi, activeSelectedMetric) {
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.styles = [];
	this.keysInTile = [];
	this.labelsVisibility = [];
	this.index = this.activeSelectedMetric.index;

	this.AbstractConstructor();
};

LocationsComposer.prototype = new AbstractTextComposer();

LocationsComposer.prototype.render = function (mapResults, dataResults, gradient, tileKey, div, x, y, z, tileBounds) {
	var allKeys = [];
	var dataItems = dataResults.Data;
	if (this.activeSelectedMetric.HasSelectedVariable() === false) {
		return;
	}
	var variableId = this.activeSelectedMetric.SelectedVariable().Id;
	var id;
	var varId;
	this.UpdateTextStyle(z);
	var colorMap = this.activeSelectedMetric.GetStyleColorDictionary();

	if (this.keysInTile.hasOwnProperty(tileKey) === false) {
		this.keysInTile[tileKey] = [];
	}

	var variable = this.activeSelectedMetric.SelectedVariable();

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
				if (! variable.IsSimpleCount) {
					mapItem.Value = this.FormatValue(variable, dataElement);
				}

				// Pone el texto
				this.AddFeatureText(variable, val, dataElement, tileKey, tileBounds, colorMap);

				allKeys.push(id);

				this.createMarker(tileKey, mapItem);
			}
		}
	}
};

LocationsComposer.prototype.AddFeatureText = function (variable, val, dataElement, tileKey, tileBounds, colorMap) {
	if (this.activeSelectedMetric.showText() === false) {
		return;
	}
	var location = new window.google.maps.LatLng(parseFloat(dataElement['Lat']), parseFloat(dataElement['Lon']));

	if (this.inTile(tileBounds, location)) {
		this.ResolveValueLabel(variable, dataElement, location, tileKey, colorMap[val]);
	}
};

LocationsComposer.prototype.createMarker = function (tileKey, feature) {
	var loc = this;
	var metric = loc.activeSelectedMetric;
	var variable = metric.SelectedVariable();
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

	var z = window.SegMap.frame.Zoom;
	var params = {};
	var element;

	params.map = loc.MapsApi.gMap;
	params.position = geo;
	params.icon = loc.objectClone(style);
	params.icon.fillOpacity = 1;
	params.icon.path = Svg.markerPinche;

	var symbol = metric.GetSymbolInfo();
	var n = 1;
	if (metric.SelectedLevel().Dataset.ScaleSymbol) {
		var adjust = 21;
		n = h.getScaleFactor(z) / adjust;
	}
	params.icon.scale = n;
	params.icon.anchor = new loc.MapsApi.google.maps.Point(10.5, 32);
	params.icon.labelOrigin = new loc.MapsApi.google.maps.Point(11.5, 11);
	params.label = {
		color: 'white',
		fontSize: (12 * n) + 'px',
		fontWeight: symbol['weight'],
		fontFamily: symbol['family'],
		text: symbol['unicode']
	};

	element = new loc.MapsApi.google.maps.Marker(params);
	this.addMarkerListeners(metric, element, feature, z);
	//}

	if (loc.keysInTile.hasOwnProperty(tileKey) === false) {
		loc.keysInTile[tileKey] = [];
	}
	loc.keysInTile[tileKey].push(element);
};

LocationsComposer.prototype.addMarkerListeners = function (metric, element, feature, z) {
	var loc = this;
	if (loc.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo) {
		element.addListener('click', function (e) {
			var parentInfo = {
				MetricId: metric.properties.Metric.Id,
				MetricVersionId: metric.SelectedVersion().Version.Id,
				LevelId: metric.SelectedLevel().Id,
				VariableId: metric.SelectedVariable().Id
			};
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
			VariableId: metric.SelectedVariable().Id
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
			VariableId: metric.SelectedVariable().Id
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
