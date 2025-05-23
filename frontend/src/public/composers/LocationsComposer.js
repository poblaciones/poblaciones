import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import h from '@/public/js/helper';
import arr from '@/common/framework/arr';
import SequenceHandler from './SequenceHandler';
import MarkerClusterer from '@googlemaps/markerclustererplus';

export default LocationsComposer;

function LocationsComposer(mapsApi, activeSelectedMetric) {
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.keysInTile = {};
	this.labelsVisibility = [];
	this.customIcons = this.activeSelectedMetric.Icons();
	if (this.activeSelectedMetric.HasSelectedVariable()) {
		this.variable = this.activeSelectedMetric.SelectedVariable();
	} else {
		this.variable = null;
	}
	this.SequenceHandler = new SequenceHandler(mapsApi, this, activeSelectedMetric);
	this.markerFactory = mapsApi.CreateMarkerFactory(this.activeSelectedMetric, this.variable, this.customIcons);
	this.AbstractConstructor();
};

LocationsComposer.prototype = new AbstractTextComposer();

LocationsComposer.prototype.renderLabels = function (dataItems, tileKey, tileBounds, zoom) {
	if (this.variable === null) {
		return;
	}
	var variable = this.variable;
	if (!variable) {
		return;
	}
	var variableId = variable.Id;
	var id;
	var varId;
	var colorMap = this.activeSelectedMetric.GetStyleColorDictionary();

	if (this.keysInTile.hasOwnProperty(tileKey) === false) {
		this.keysInTile[tileKey] = [];
	}

	var markerSettings = this.activeSelectedMetric.SelectedMarker();
	this.UpdateTextStyle(zoom, markerSettings);
	var markers = [];

	for (var i = 0; i < dataItems.length; i++) {
		var dataElement = dataItems[i];
		varId = dataElement['VID'];
		if (varId === variableId) {
			id = dataElement['FID'];

			var val = dataElement['LID'];
			var valKey = 'K' + val;
			if (!(valKey in this.labelsVisibility)) {
				this.labelsVisibility[valKey] = this.activeSelectedMetric.ResolveValueLabelVisibility(val);
			}
			if (this.labelsVisibility[valKey]) {
				if (!this.activeSelectedMetric.IsDeckGLLayer()) {
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
					if (!variable.IsSimpleCount) {
						mapItem.Value = this.FormatValue(variable, dataElement);
					}

					var isSequenceInactiveStep = this.isSequenceInactiveStep(mapItem);
					var marker = this.markerFactory.CreateMarker(tileKey, mapItem, markerSettings, isSequenceInactiveStep);

					this.registerTileMarker(tileKey, marker);
					if (variable.IsSequence) {
						this.SequenceHandler.registerSequenceMarker(tileKey, mapItem, marker, zoom);
					}
				}
				// Pone el perímetro
				this.AddPerimeter(variable, val, dataElement, tileKey, tileBounds, colorMap);
				// Pone el texto
				this.AddFeatureText(variable, val, dataElement, tileKey, tileBounds, colorMap, markerSettings, zoom);
			}
		}
	}
	/*
	var new_mc = new MarkerClusterer(window.SegMap.MapsApi.gMap, markers, {
    maxZoom: 9
			});
*/
};


LocationsComposer.prototype.GetTileCacheKey = function (x, y, z) {
	if (!this.activeSelectedMetric || !this.activeSelectedMetric.HasSelectedVariable()) {
		return null;
	}
	var v = this.activeSelectedMetric.SelectedVariable().Id;
	return h.getVariableFrameKey(v, x, y, z);
};

LocationsComposer.prototype.UpdateTextStyle = function (z, markerSettings) {
	var scale = this.markerFactory.CalculateMarkerScale(markerSettings, z);
	var size = parseInt(4 - scale);
	if (size < 0) size = 0;
	if (size > 4 || scale < 1) size = 4;

	this.textStyle = 'mapLabels ml' + size;
};

LocationsComposer.prototype.isSequenceInactiveStep = function (mapItem) {
	return this.variable.IsSequence && this.activeSelectedMetric.GetActiveSequenceStep(this.variable.Id, mapItem.LabelId) !== mapItem.Sequence;
};

LocationsComposer.prototype.registerTileMarker = function (tileKey, marker) {
	if (this.keysInTile.hasOwnProperty(tileKey) === false) {
		this.keysInTile[tileKey] = [];
	}
	this.keysInTile[tileKey].push(marker);
};

LocationsComposer.prototype.AddFeatureText = function (variable, val, dataElement, tileKey, tileBounds, colorMap, markerSettings, z) {
	if (variable.ShowValues == 0 && (dataElement.Description === null
		|| parseInt(variable.ShowDescriptions) == 0) ) {
		return;
	}
	var scale = this.markerFactory.CalculateMarkerScale(markerSettings, z);
	if (scale < .25) {
		return;
	}
	var location = { Lat: parseFloat(dataElement['Lat']), Lon: parseFloat(dataElement['Lon']) };
	var clickId = null;
	if (this.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo) {
		clickId = this.activeSelectedMetric.CreateParentInfo(variable, dataElement);
	}
	if (this.inTile(tileBounds, location)) {
		this.ResolveValueLabel(variable, clickId, dataElement, location, tileKey, colorMap[val], markerSettings, z, false);
	}
};

LocationsComposer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);
	this.clearTilePerimeters(tileKey);

	var items = this.keysInTile[tileKey];
	if (items) {
		this.SequenceHandler.removeTileSequenceMarker(tileKey);
		for (var i = 0; i < items.length; i++) {
			this.destroyMarker(items[i]);
		}
	}
	this.keysInTile[tileKey] = [];
	delete this.keysInTile[tileKey];
};

LocationsComposer.prototype.removeAndDestroyMarker = function (tileKey, marker) {
	if (this.keysInTile[tileKey]) {
		arr.Remove(this.keysInTile[tileKey], marker);
	}
	this.destroyMarker(marker);
};

LocationsComposer.prototype.destroyMarker = function (marker) {
	if (marker.extraMarker) {
		this.MapsApi.FreeMarker(marker.extraMarker);
	}
	if (marker.extraMarkerImage) {
		this.MapsApi.FreeMarker(marker.extraMarkerImage);
	}
	this.MapsApi.FreeMarker(marker);
};

LocationsComposer.prototype.dispose = function () {
	for (var k in this.keysInTile) {
		if (this.keysInTile.hasOwnProperty(k)) {
			this.removeTileFeatures(k);
		}
	}
	this.clearText();
	this.clearPerimeter();
};
