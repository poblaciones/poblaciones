import SvgComposer from './SvgComposer';
import h from '@/public/js/helper';

export default BoundariesComposer;

function BoundariesComposer(mapsApi, activeSelectedMetric) {
	SvgComposer.call(this, mapsApi, activeSelectedMetric);
};

BoundariesComposer.prototype = new SvgComposer();

BoundariesComposer.prototype.render = function (mapResults, dataResults, gradient, tileKey, div, x, y, z, tileBounds) {
	var filtered = [];
	var allKeys = [];
	var dataItems = dataResults.Data.features;
	var projected = dataResults.Data.projected;

	if (this.activeSelectedMetric.visible === false) {
		return;
	}
	var patternValue = 1;
	var tileUniqueId = SvgComposer.uniqueCssId++;
	this.UpdateTextStyle(z);
	var colorMap = this.activeSelectedMetric.GetStyleColorDictionary();

	if (dataItems.length === 0) return;
	var id;
	for (var i = 0; i < dataItems.length; i++) {
		id = dataItems[i].id;
		this.processFeature(tileUniqueId, dataItems[i], tileKey, tileBounds, filtered, colorMap);
	}
	this.keysInTile[tileKey] = allKeys;

	var parentAttributes = {
		boundaryId: this.activeSelectedMetric.properties.Id,
	};
	var svg = this.CreateSVGOverlay(tileUniqueId, div, parentAttributes, filtered, projected, tileBounds, z, patternValue);

	if (svg !== null) {
		var key = h.getFrameKey(x, y, z, this.MapsApi.TileBoundsRequired());
		this.svgInTile[key] = svg;
	}
};

BoundariesComposer.prototype.processFeature = function (tileUniqueId, dataElement,
										tileKey, tileBounds, filtered, colorMap) {
	//var val = dataElement['ValueId'];
	var val = 1;

	// Lo agrega
	var centroid = this.getCentroid(dataElement);
	var isLineString = (dataElement.geometry.type === 'LineString' || dataElement.geometry.type === 'MultiLineString' ? ' ls' : '');
	var mapItem = {
		id: dataElement.id, type: dataElement.type, geometry: dataElement.geometry,
					properties: { className: 'e' + tileUniqueId + '_' + val + isLineString }
	};
	if (dataElement.properties.Description) {
		mapItem.properties.description = dataElement.properties.Description.replaceAll('"', '&#x22;');
	}
	var clickId = "B" + dataElement.id;
	this.AddFeatureText(val, dataElement, clickId, centroid, tileKey, tileBounds, colorMap);

	filtered.push(mapItem);
};

BoundariesComposer.prototype.getCentroid = function (mapElement) {
	return new window.google.maps.LatLng(mapElement.properties.centroid[0], mapElement.properties.centroid[1]);
};


BoundariesComposer.prototype.AddFeatureText = function (val, dataElement, effectiveId, centroid, tileKey, tileBounds, colorMap) {
	if (dataElement.properties.Description === null || !this.activeSelectedMetric.showDescriptions) {
		return;
	}
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