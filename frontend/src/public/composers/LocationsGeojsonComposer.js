import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import Svg from '@/public/js/svg';
import h from '@/public/js/helper';

export default LocationsGeojsonComposer;

function LocationsGeojsonComposer(mapsApi, activeSelectedMetric) {
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.styles = [];
	this.keysInTile = [];
	this.labelsVisibility = [];
	this.index = this.activeSelectedMetric.index;

	this.AbstractConstructor();
};

LocationsGeojsonComposer.prototype = new AbstractTextComposer();

LocationsGeojsonComposer.prototype.renderGeoJson = function (dataMetric, mapResults, dataResults, tileKey, div, x, y, z, tileBounds) {
	var filtered = [];
	var allKeys = [];
	var dataItems = dataResults.Data;
	if (this.activeSelectedMetric.HasSelectedVariable() === false) {
		return { 'type': 'FeatureCollection', 'features': [] };
	}
	var variableId = this.activeSelectedMetric.SelectedVariable().Id;
	var id;
	var varId;
	this.UpdateTextStyle(z);
	var colorMap = this.activeSelectedMetric.GetStyleColorDictionary();

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
				mapItem['id'] = dataElement['FID'];
				mapItem['type'] = 'Feature';
				mapItem['geometry'] = {
					'type': 'Point',
					'coordinates': [parseFloat(dataElement['Lon']), parseFloat(dataElement['Lat'])]
				};
				mapItem['properties'] = {
					'LabelId': val
				};
				if (this.activeSelectedMetric.SelectedVariable().ShowValues == 1) {
					mapItem['properties'].Value = dataElement['Value'];
				}
				if (dataElement['Description']) {
					mapItem['properties'].Description = dataElement['Description'];
				}
				filtered.push(mapItem);

				// Pone el texto
				this.AddFeatureText(val, dataElement, tileKey, tileBounds, colorMap);

				allKeys.push(id);
			}
		}
	}
	if (this.keysInTile.hasOwnProperty(tileKey) === false) {
		this.keysInTile[tileKey] = [];
	}
	return { 'type': 'FeatureCollection', 'features': filtered };
};

LocationsGeojsonComposer.prototype.AddFeatureText = function (val, dataElement, tileKey, tileBounds, colorMap) {
	if (this.activeSelectedMetric.showText() === false) {
		return;
	}
	var location = new window.google.maps.LatLng(parseFloat(dataElement['Lat']), parseFloat(dataElement['Lon']));

	if (this.inTile(tileBounds, location)) {
		this.ResolveValueLabel(dataElement, location, tileKey, colorMap[val]);
	}
};

LocationsGeojsonComposer.prototype.bindStyles = function (dataMetric, tileKey) {
	var loc = this;

	dataMetric.setStyle(function (feature) {
		var metric = loc.activeSelectedMetric;
		var labelId = feature.getProperty('LabelId');
		var keyLabel = 'L' + labelId;

		var style;
		if (keyLabel in loc.styles) {
			style = loc.styles[keyLabel];
		} else {
			style = metric.ResolveStyle(labelId);
			loc.styles[keyLabel] = style;
		}
		var geo = feature.getGeometry();

		var z = window.SegMap.frame.Zoom;
		var params = {};
		var element;

		//TODO: definir cómo saber si es círculo o ícono.
		if(function() { return false; }() /* ElementIsCircle() */) {
			params = loc.objectClone(style);
			params.map = loc.MapsApi.gMap;
			params.center = geo.get();

			var r = 100;
			// efecto visual: a partir del zoom 14, crecen a la mitad del ritmo.
			if (z >= 14) {
				r = r / Math.pow(2, (z - 13) / 2);
			}
			params.radius = r;
			element = new loc.MapsApi.google.maps.Circle(params);
		} else {
			params.map = loc.MapsApi.gMap;
			params.position = geo.get();
			params.icon = loc.objectClone(style);
			params.icon.fillOpacity = 1;
			params.icon.path = Svg.markerPinche;

			var adjust = 21;
			var n = h.getScaleFactor(z) / adjust;

			var symbol = loc.activeSelectedMetric.GetSymbolInfo();

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
			if (loc.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo) {
				element.addListener('click', function (e) {
					var parentInfo = {
						MetricName: metric.properties.Metric.Name,
						MetricId: metric.properties.Metric.Id,
						MetricVersionId: metric.SelectedVersion().Version.Id,
						LevelId: metric.SelectedLevel().Id,
						VariableId: metric.SelectedVariable().Id
					};
					loc.MapsApi.markerClicked(e, parentInfo, feature.getId(),
						new loc.MapsApi.google.maps.Size(0, -1 * h.getScaleFactor(z)));
				});
			} else {
				element.clickable = false;
			}
			element.addListener('mouseover', function (e) {
				var parentInfo = {
					MetricName: metric.properties.Metric.Name,
					MetricId: metric.properties.Metric.Id,
					MetricVersionId: metric.SelectedVersion().Version.Id,
					LevelId: metric.SelectedLevel().Id,
					VariableId: metric.SelectedVariable().Id
				};
				loc.MapsApi.selector.markerMouseOver(e, parentInfo, feature.getId(), feature.getProperty('Description'));
			});
			element.addListener('mouseout', function (e) {
				var parentInfo = {
					MetricName: metric.properties.Metric.Name,
					MetricId: metric.properties.Metric.Id,
					MetricVersionId: metric.SelectedVersion().Version.Id,
					LevelId: metric.SelectedLevel().Id,
					VariableId: metric.SelectedVariable().Id
				};
				loc.MapsApi.selector.markerMouseOut(e, parentInfo, feature.getId(),
					new loc.MapsApi.google.maps.Size(0, -1 * h.getScaleFactor(z)));
			});
		}

		if (loc.keysInTile.hasOwnProperty(tileKey) === false) {
			loc.keysInTile[tileKey] = [];
		}
		loc.keysInTile[tileKey].push(element);
		return { visible: false };
	});
};

LocationsGeojsonComposer.prototype.objectClone = function (obj) {
	if (obj === null || typeof obj !== 'object') return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
};

LocationsGeojsonComposer.prototype.removeTileFeatures = function (tileKey) {
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

LocationsGeojsonComposer.prototype.clear = function () {
	for (var k in this.keysInTile) {
		if (this.keysInTile.hasOwnProperty(k)) {
			this.removeTileFeatures(k);
		}
	}
	this.clearText();
};
