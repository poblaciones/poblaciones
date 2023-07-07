import AbstractTextComposer from '@/public/composers/AbstractTextComposer';
import h from '@/public/js/helper';

export default LabelsComposer;

function LabelsComposer(mapsApi, activeSelectedMetric) {
	this.AbstractConstructor();

	this.MapsApi = mapsApi;
	this.activeSelectedMetric = activeSelectedMetric;
	this.index = this.activeSelectedMetric.index;

	this.styles = [];
	this.keysInTile = [];
	this.labelsVisibility = [];
	this.usePreview = false;

};
LabelsComposer.prototype = new AbstractTextComposer();

LabelsComposer.prototype.renderLabels = function (dataItems, tileKey, tileBounds, zoom) {
	var currentZoom = this.MapsApi.getZoom();
	if (zoom !== currentZoom) {
		console.error("zoom failed:" + zoom + " != " + currentZoom);
	}
	for (var i = 0; i < dataItems.length; i++) {
		var dataElement = dataItems[i];
		var location = { Lat: dataElement['Lat'], Lon: dataElement['Lon'] };

		var textElement = { FIDs: dataElement['FIDs'] };

		if (dataElement['Show']) {
			textElement.type = dataElement['type'];
			textElement.caption = dataElement['Caption'];
			textElement.tooltip = dataElement['Tooltip'];
			textElement.clickId = (dataElement['FIDs'] === null || dataElement['type'] === 'C' ? dataElement['RID'] : dataElement['FIDs']);
			textElement.symbol = dataElement['Symbol'];

			this.UpdateTextStyle(dataElement['Size'], dataElement['type']);
		} else {
			textElement.hidden = true;
		}
		if (!textElement.hidden) {
			this.SetTextOverlay(textElement, tileKey, location, null, '', zoom, false);
		}
	}

};

LabelsComposer.prototype.GetTileCacheKey = function (x, y, z) {
	return h.getFrameKey(x, y, z);
};

LabelsComposer.prototype.removeTileFeatures = function (tileKey) {
	this.clearTileText(tileKey);
};

LabelsComposer.prototype.UpdateTextStyle = function (size, type) {
	this.textStyle = 'mapLabels ml' + size;
	if (type === 'F') {
		this.textStyle += ' sl';
	}
};

LabelsComposer.prototype.dispose = function () {
	this.clearText();
};
