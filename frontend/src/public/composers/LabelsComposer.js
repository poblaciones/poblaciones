import AbstractTextComposer from '@/public/composers/AbstractTextComposer';

export default LabelsComposer;

function LabelsComposer(mapsApi, activeLabelMetric) {
	this.AbstractConstructor();

	this.MapsApi = mapsApi;
	this.activeLabelMetric = activeLabelMetric;
	this.index = this.activeLabelMetric.index;

	this.styles = [];
	this.keysInTile = [];
	this.labelsVisibility = [];
};
LabelsComposer.prototype = new AbstractTextComposer();

LabelsComposer.prototype.renderGeoJson = function(dataMetric, mapResults, dataResults, tileKey, div, x, y, z, tileBounds) {
	var dataItems = dataResults.Data;

	for (var i = 0; i < dataItems.length; i++) {
		var dataElement = dataItems[i];
		var location = new window.google.maps.LatLng(dataElement['Lat'], dataElement['Lon']);

		if (dataElement['Show']) {
			this.UpdateTextStyle(dataElement['Size']);
			this.SetTextOverlay(dataElement['type'], dataElement['FIDs'], tileKey, location, dataElement['Caption'], dataElement['Tooltip'], null, '', (dataElement['FIDs'] === null ? dataElement['RID'] : dataElement['FIDs']));
		} else {
			this.SetTextOverlay(null, dataElement['FIDs'], tileKey, location, null, null, null, '', null, true);
		}
	}

	return { 'type': 'FeatureCollection', 'features': [] };
};

LabelsComposer.prototype.bindStyles = function (dataMetric, tileKey) {
};

LabelsComposer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);
};

LabelsComposer.prototype.UpdateTextStyle = function (size) {
	this.textStyle = 'mapLabels ml' + size;
};

LabelsComposer.prototype.clear = function () {
	this.clearText();
};
