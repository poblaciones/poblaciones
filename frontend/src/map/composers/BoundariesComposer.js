import AbstractSvgComposer from './AbstractSvgComposer';
import h from '@/map/js/helper';

export default BoundariesComposer;

function BoundariesComposer(mapsApi, activeSelectedMetric) {
	AbstractSvgComposer.call(this, mapsApi, activeSelectedMetric);
	this.strokeWidthScaling = 2;
};

BoundariesComposer.prototype = new AbstractSvgComposer();


BoundariesComposer.prototype.renderLabels = function (dataItems, tileKey, tileBounds, zoom) {
	if (dataItems.length === 0) return;

	if (this.activeSelectedMetric.visible === false) {
		return;
	}
	this.UpdateTextStyle(zoom);

	for (var i = 0; i < dataItems.length; i++) {
		var dataElement = dataItems[i];
		if (this.labelValueIsVisible(dataElement.properties.LabelId)) {
			this.AddFeatureText(dataElement, tileKey, tileBounds, zoom);
		}
	}
};


BoundariesComposer.prototype.AddFeatureText = function (dataElement, tileKey, tileBounds, zoom) {
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
		this.SetTextOverlay(textElement, tileKey, location, null, '', zoom, false);
	}
};

// Mismo patrón que DataShapeComposer.labelValueIsVisible: caché por tile de
// la visibilidad resuelta contra el ValueLabel correspondiente.
BoundariesComposer.prototype.labelValueIsVisible = function (val) {
	var valKey = 'K' + val;
	if (!(valKey in this.labelsVisibility)) {
		this.labelsVisibility[valKey] = this.activeSelectedMetric.ResolveValueLabelVisibility(val);
	}
	return this.labelsVisibility[valKey];
};

BoundariesComposer.prototype.renderPolygons = function (mapResults, dataItems, gradient, div, x, y, z, tileBounds) {
	var features = [];

	var patternValue = this.activeSelectedMetric.GetPattern();

	if (this.activeSelectedMetric.visible === false) {
		return;
	}
	var tileUniqueId = AbstractSvgComposer.uniqueCssId++;

	if (dataItems.length === 0) return;
	for (var i = 0; i < dataItems.length; i++) {
		var feature = this.processFeature(tileUniqueId, dataItems[i], patternValue);
		if (feature !== null) {
			features.push(feature);
		}
	}
	var parentAttributes = {
		boundaryId: this.activeSelectedMetric.properties.Id,
	};
	return this.CreateSVGOverlay(tileUniqueId, div, parentAttributes, features, z, patternValue);
};

BoundariesComposer.prototype.GetTileCacheKey = function (x, y, z) {
	return h.getFrameKey(x, y, z);
};

BoundariesComposer.prototype.processFeature = function (tileUniqueId, dataElement, patternValue) {
	// Se fija si por etiqueta (ClippingRegion de origen) está visible
	var val = dataElement.properties.LabelId;
	if (!this.labelValueIsVisible(val)) {
		return null;
	}
	var isLineString = (dataElement.geometry.type === 'LineString' || dataElement.geometry.type === 'MultiLineString' ? ' ls' : '');
	var mapItem = {
		id: dataElement.id, type: dataElement.type, geometry: dataElement.geometry,
					properties: { className: 'e' + tileUniqueId + '_' + val + isLineString }
	};
	if (dataElement.properties.Description) {
		mapItem.properties.description = dataElement.properties.Description.replaceAll('"', '&#x22;');
	}
	// Mismo patrón que DataShapeComposer.processFeature: sin esto, el fill de
	// las tramas de textura (Diagonal, Puntos) queda referenciando un pattern
	// SVG inexistente (fill: url(#..._undefined)), y el navegador cae al fill
	// por defecto de la clase CSS, que para patternValue!=0 es "sin relleno"
	// (el mismo aspecto que Contorno).
	if (this.patternUseFillStyles(patternValue)) {
		mapItem.properties.patternClass = 'cs' + val;
	}
	return mapItem;
};

BoundariesComposer.prototype.getCentroid = function (mapElement) {
	return { Lat: mapElement.properties.centroid[0], Lon: mapElement.properties.centroid[1] };
};
