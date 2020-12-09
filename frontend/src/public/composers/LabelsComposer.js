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

		var textElement = { FIDs: dataElement['FIDs']	};

		if (dataElement['Show']) {
			textElement.type = dataElement['type'];
			textElement.caption = dataElement['Caption'];
			textElement.tooltip = dataElement['Tooltip'];
			textElement.clickId = (dataElement['FIDs'] === null || dataElement['type'] === 'C' ? dataElement['RID'] : dataElement['FIDs']);
			textElement.symbol = dataElement['Symbol'];

			this.UpdateTextStyle(dataElement['Size']);
		} else {
			textElement.hidden = true;
		}
		this.SetTextOverlay(textElement, tileKey, location, null, '');
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
