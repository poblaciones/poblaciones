import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import h from '@/public/js/helper';
import arr from '@/common/js/arr';
import SequenceComposer from './SequenceComposer';
import MarkerFactory from '@/public/GoogleMaps/MarkerFactory';

export default LocationsComposer;

function LocationsComposer(mapsApi, activeSelectedMetric) {
	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.keysInTile = {};
	this.labelsVisibility = [];
	this.index = this.activeSelectedMetric.index;
	this.zIndex = (1000 - this.index) * 100;
	this.customIcons = this.processCustomIcons(this.activeSelectedMetric.SelectedVersion().Work.Icons);
	if (this.activeSelectedMetric.HasSelectedVariable()) {
		this.variable = this.activeSelectedMetric.SelectedVariable();
	} else {
		this.variable = null;
	}
	this.SequenceComposer = new SequenceComposer(mapsApi, this, activeSelectedMetric);
	this.markerFactory = new MarkerFactory(this.MapsApi, this.activeSelectedMetric, this.variable, this.zIndex, this.customIcons);
	this.AbstractConstructor();
};

LocationsComposer.prototype = new AbstractTextComposer();

LocationsComposer.prototype.render = function (mapResults, dataResults, gradient, tileKey, div, x, y, z, tileBounds) {
	var dataItems = dataResults.Data;
	if (this.variable === null) {
		return;
	}
	var variable = this.variable;
	var variableId = variable.Id;
	var id;
	var varId;
	var colorMap = this.activeSelectedMetric.GetStyleColorDictionary();

	if (this.keysInTile.hasOwnProperty(tileKey) === false) {
		this.keysInTile[tileKey] = [];
	}

	var markerSettings = this.activeSelectedMetric.SelectedLevel().Dataset.Marker;
	this.UpdateTextStyle(z, markerSettings);

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

				var isSequenceInactiveStep = this.isSequenceInactiveStep(mapItem);
				var marker = this.markerFactory.CreateMarker(tileKey, mapItem, markerSettings, isSequenceInactiveStep);
				this.registerTileMarker(tileKey, marker);
				if (variable.IsSequence) {
					this.SequenceComposer.registerSequenceMarker(tileKey, mapItem, marker, z);
				}
				// Pone el texto
				this.AddFeatureText(variable, val, dataElement, tileKey, tileBounds, colorMap, markerSettings, z);
			}
		}
	}
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
		|| parseInt(variable.ShowDescriptions) == 0)) {
		return;
	}
	var scale = this.markerFactory.CalculateMarkerScale(markerSettings, z);
	if (scale < .25) {
		return;
	}
	var location = new this.MapsApi.google.maps.LatLng(parseFloat(dataElement['Lat']), parseFloat(dataElement['Lon']));
	var clickId = null;
	if (this.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo) {
		clickId = this.activeSelectedMetric.CreateParentInfo(variable, dataElement);
	}
	if (this.inTile(tileBounds, location)) {
		this.ResolveValueLabel(variable, clickId, dataElement, location, tileKey, colorMap[val], markerSettings);
	}
};

LocationsComposer.prototype.processCustomIcons = function (icons) {
	var ret = {};
	if (!icons) {
		return ret;
	}
	for (var n = 0; n < icons.length; n++) {
		ret[icons[n].Caption] = icons[n].Image;
	}
	return ret;
};

LocationsComposer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);

	var items = this.keysInTile[tileKey];
	if (items) {
		this.SequenceComposer.removeTileSequenceMarker(tileKey);
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
		marker.extraMarker.setMap(null);
	}
	if (marker.extraMarkerImage) {
		marker.extraMarkerImage.setMap(null);
	}
	marker.setMap(null);
};

LocationsComposer.prototype.dispose = function () {
	for (var k in this.keysInTile) {
		if (this.keysInTile.hasOwnProperty(k)) {
			this.removeTileFeatures(k);
		}
	}
	this.clearText();
};
