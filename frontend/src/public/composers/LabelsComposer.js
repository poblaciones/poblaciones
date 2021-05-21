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

LabelsComposer.prototype.renderLabels = function(dataItems, tileKey, tileBounds, zoom) {
	for (var i = 0; i < dataItems.length; i++) {
		var dataElement = dataItems[i];
		var location = new window.google.maps.LatLng(dataElement['Lat'], dataElement['Lon']);

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
			this.SetTextOverlay(textElement, tileKey, location, null, '', zoom);
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
