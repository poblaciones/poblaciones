import DataShapeComposer from './DataShapeComposer';
import AbstractSvgComposer from './AbstractSvgComposer';


import h from '@/map/js/helper';

export default SegmentsComposer;

function SegmentsComposer(mapsApi, activeSelectedMetric) {
	DataShapeComposer.call(this, mapsApi, activeSelectedMetric);
	this.strokeWidthScaling = 2;
	this.useSvgMarkers = true;
};

SegmentsComposer.prototype = new DataShapeComposer();

SegmentsComposer.prototype.renderPolygons = function (mapResults, dataItems, gradient, div, x, y, z, tileBounds) {
	var features = [];
	if (this.activeSelectedMetric.HasSelectedVariable() === false) {
		return;
	}
	var patternValue = 1;
	var tileUniqueId = AbstractSvgComposer.uniqueCssId++;

	if (dataItems.length === 0) return;

	for (var i = 0; i < dataItems.length; i++) {
		var feature = this.processFeature(tileUniqueId, dataItems[i]);
		if (feature) {
			features.push(feature);
		}
	}
	var parentAttributes = {
		metricId: this.activeSelectedMetric.properties.Metric.Id,
		metricVersionId: this.activeSelectedMetric.SelectedVersion().Version.Id,
		levelId: this.activeSelectedMetric.SelectedLevel().Id,
		variableId: this.activeSelectedMetric.SelectedVariable().Id,
		showInfo: (this.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo ? "1" : "0")
	};

	return this.CreateSVGOverlay(tileUniqueId, div, parentAttributes, features, z, patternValue);
};

SegmentsComposer.prototype.processFeature = function (tileUniqueId, dataElement) {
	// Se fija si por etiqueta está visible
	var val = dataElement['LID'];
	if (!this.labelValueIsVisible(val)) {
		return null;
	}
	// Lo agrega
	var mapItem = {
		id: dataElement.FID, type: dataElement.type, geometry: dataElement.Geometry,
					properties: { className: 'e' + tileUniqueId + '_' + val + ' ls' }
	};
	if (dataElement.Description) {
		mapItem.properties.description = dataElement.Description.replaceAll('"', '&#x22;');
	}
	var variable = this.activeSelectedMetric.SelectedVariable();
	if (!variable.IsSimpleCount) {
		mapItem.properties.value = this.FormatValue(variable, dataElement);
	}
	return mapItem;
};
