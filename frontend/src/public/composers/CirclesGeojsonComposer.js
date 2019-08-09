import AbstractTextComposer from '@/composers/AbstractTextComposer';

export default CirclesGeojsonComposer;

function CirclesGeojsonComposer(mapsApi, activeSelectedMetric) {
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.styles = [];
	this.keysInTile = [];
	this.labelsVisibility = [];
	this.index = this.activeSelectedMetric.index;

	this.AbstractConstructor();
};

CirclesGeojsonComposer.prototype = new AbstractTextComposer();

CirclesGeojsonComposer.prototype.renderGeoJson = function (dataMetric, mapResults, dataResults, tileKey, div, x, y, z, tileBounds) {
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
				if (this.activeSelectedMetric.SelectedVariable().ShowValues === 1) {
					mapItem['properties'].Value = dataElement['Value'];
				}
				if (this.activeSelectedMetric.SelectedVariable().ShowDescriptions === 1) {
					mapItem['properties'].Description = dataElement['Description'];
				}

				filtered.push(mapItem);

				// Pone el texto
				this.AddFeatureText(val, dataElement, tileKey, tileBounds, colorMap);

				allKeys.push(id);
			}
		}
	}
	this.keysInTile[tileKey] = [];
	return { 'type': 'FeatureCollection', 'features': filtered };
};

CirclesGeojsonComposer.prototype.AddFeatureText = function (val, dataElement, tileKey, tileBounds, colorMap) {
	if (this.activeSelectedMetric.showText() === false) {
		return;
	}
	var location = new window.google.maps.LatLng(parseFloat(dataElement['Lat']), parseFloat(dataElement['Lon']));

	if (this.inTile(tileBounds, location)) {
		this.ResolveValueLabel(dataElement, location, tileKey, colorMap[val]);
	}
};

CirclesGeojsonComposer.prototype.bindStyles = function (dataMetric, tileKey) {
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

		var params = loc.objectClone(style);
		params.map = loc.MapsApi.gMap;
		params.center = geo.get();

		// efecto visual: a partir del zoom 14, crecen a la mitad del ritmo.
		var z = window.SegMap.frame.Zoom;
		var r = 100;
		if (z >= 14) {
			r = r / Math.pow(2, (z - 13) / 2);
		}
		params.radius = r;

		var circle = new loc.MapsApi.google.maps.Circle(params);
		loc.keysInTile[tileKey].push(circle);

		return { visible: false };
	});
};

CirclesGeojsonComposer.prototype.objectClone = function (obj) {
	if (obj === null || typeof obj !== 'object') return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
};

CirclesGeojsonComposer.prototype.removeTileFeatures = function (tileKey) {
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

CirclesGeojsonComposer.prototype.clear = function () {
	for (var k in this.keysInTile) {
		if (this.keysInTile.hasOwnProperty(k)) {
			this.removeTileFeatures(k);
		}
	}
	this.clearText();
};
