import AbstractSvgComposer from './AbstractSvgComposer';
import h from '@/public/js/helper';

export default BoundariesComposer;

function BoundariesComposer(mapsApi, activeSelectedMetric) {
	AbstractSvgComposer.call(this, mapsApi, activeSelectedMetric);
};

BoundariesComposer.prototype = new AbstractSvgComposer();


BoundariesComposer.prototype.renderLabels = function (dataResults, tileKey, tileBounds, zoom) {
	var dataItems = dataResults.Data.features;
	if (dataItems.length === 0) return;

	if (this.activeSelectedMetric.visible === false) {
		return;
	}
	this.UpdateTextStyle(zoom);

	for (var i = 0; i < dataItems.length; i++) {
		var dataElement = dataItems[i];
		this.AddFeatureText(dataElement, tileKey, tileBounds);
	}
};


BoundariesComposer.prototype.AddFeatureText = function (dataElement, tileKey, tileBounds) {
	if (dataElement.properties.Description === null || !this.activeSelectedMetric.showDescriptions) {
		return;
	}
	var centroid = this.getCentroid(dataElement);
	if (this.inTile(tileBounds, centroid)) {
		var location = centroid;
		var textElement = { FIDs: []	};
		textElement.type = 'C';
		textElement.caption = dataElement.properties.Description;
		textElement.tooltip = this.activeSelectedMetric.properties.Name;
		textElement.clickId = dataElement.id;
		this.SetTextOverlay(textElement, tileKey, location, null, '');
	}
};

BoundariesComposer.prototype.renderPolygons = function (mapResults, dataResults, gradient, div, x, y, z, tileBounds) {
	var filtered = [];
	var dataItems = dataResults.Data.features;

	const patternValue = 1;

	if (this.activeSelectedMetric.visible === false) {
		return;
	}
	var tileUniqueId = AbstractSvgComposer.uniqueCssId++;

	if (dataItems.length === 0) return;
	var id;
	for (var i = 0; i < dataItems.length; i++) {
		id = dataItems[i].id;
		this.processFeature(tileUniqueId, dataItems[i], filtered);
	}
	var parentAttributes = {
		boundaryId: this.activeSelectedMetric.properties.Id,
	};

	var projected = dataResults.Data.projected;
	var svg = this.CreateSVGOverlay(tileUniqueId, div, parentAttributes, filtered, projected, tileBounds, z, patternValue);
	if (svg !== null) {
		this.SaveSvg(svg, x, y, z);
	}
};

BoundariesComposer.prototype.GetSvgKey = function (x, y, z) {
	return h.getFrameKey(x, y, z);
};

BoundariesComposer.prototype.processFeature = function (tileUniqueId, dataElement, filtered) {
	var val = 1;
	// Lo agrega
	var isLineString = (dataElement.geometry.type === 'LineString' || dataElement.geometry.type === 'MultiLineString' ? ' ls' : '');
	var mapItem = {
		id: dataElement.id, type: dataElement.type, geometry: dataElement.geometry,
					properties: { className: 'e' + tileUniqueId + '_' + val + isLineString }
	};
	if (dataElement.properties.Description) {
		mapItem.properties.description = dataElement.properties.Description.replaceAll('"', '&#x22;');
	}
	filtered.push(mapItem);
};

BoundariesComposer.prototype.getCentroid = function (mapElement) {
	return new window.google.maps.LatLng(mapElement.properties.centroid[0], mapElement.properties.centroid[1]);
};


