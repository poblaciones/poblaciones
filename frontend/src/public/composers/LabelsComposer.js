import AbstractTextComposer from '@/public/composers/AbstractTextComposer';

export default LabelsComposer;

function LabelsComposer(mapsApi, activeSelectedMetric) {
	this.AbstractConstructor();

	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.index = this.activeSelectedMetric.index;

	this.styles = [];
	this.keysInTile = [];
	this.labelsVisibility = [];
};
LabelsComposer.prototype = new AbstractTextComposer();

LabelsComposer.prototype.render = function(mapResults, dataResults, gradient, tileKey, div, x, y, z, tileBounds) {
	var dataItems = dataResults.Data;

	for (var i = 0; i < dataItems.length; i++) {
		var dataElement = dataItems[i];
		var location = new window.google.maps.LatLng(dataElement['Lat'], dataElement['Lon']);

		if (dataElement['Show']) {
			this.UpdateTextStyle(dataElement['Size']);
			this.SetTextOverlay(dataElement['type'], dataElement['FIDs'], tileKey, location, dataElement['Caption'], dataElement['Tooltip'], null, '', (dataElement['FIDs'] === null || dataElement['type'] === 'C' ? dataElement['RID'] : dataElement['FIDs']));
		} else {
			this.SetTextOverlay(null, dataElement['FIDs'], tileKey, location, null, null, null, '', null, true);
		}
	}
};

LabelsComposer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);
};

LabelsComposer.prototype.UpdateTextStyle = function (size) {
	this.textStyle = 'mapLabels ml' + size;
};

LabelsComposer.prototype.dispose = function () {
	this.clearText();
};
