import AbstractSvgComposer from './AbstractSvgComposer';
import OverlapCollection from './../classes/OverlapCollection';

import h from '@/public/js/helper';

export default DataShapeComposer;

function DataShapeComposer(mapsApi, activeSelectedMetric) {
	AbstractSvgComposer.call(this, mapsApi, activeSelectedMetric);
	this.Rectangles = null;
	this.useGradients = window.SegMap.Configuration.UseGradients;
	this.useTextures = window.SegMap.Configuration.UseTextures;
};

DataShapeComposer.prototype = new AbstractSvgComposer();

DataShapeComposer.prototype.renderLabels = function (dataItems, tileKey, tileBounds, zoom) {
	if (this.activeSelectedMetric.HasSelectedVariable() === false) {
		return;
	}
	this.Rectangles = new OverlapCollection();
	this.UpdateTextStyle(zoom);
	var variable = this.activeSelectedMetric.SelectedVariable();
	var colorMap = this.activeSelectedMetric.GetStyleColorDictionary();
	var showInfo = this.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo;

	for (var i = 0; i < dataItems.length; i++) {
		var dataElement = dataItems[i];
		var val = dataElement['LID'];
		// Se fija si por etiqueta está visible
		if (this.labelValueIsVisible(val)) {
			var clickId = null;
			if (showInfo) {
				clickId = this.activeSelectedMetric.CreateParentInfo(variable, dataElement);
			};
			this.AddFeatureText(variable, val, dataElement, clickId, tileKey, tileBounds, colorMap, zoom);
		}
	}
};

DataShapeComposer.prototype.renderPolygons = function (mapResults, dataItems, gradient, div, x, y, z, tileBounds, texture) {
	var filtered = [];
	var mapItems = mapResults.Data.features;
	if (this.activeSelectedMetric.HasSelectedVariable() === false) {
		return;
	}
	var variableId = this.activeSelectedMetric.SelectedVariable().Id;
	var patternValue = parseInt(this.activeSelectedMetric.GetPattern());
	var tileUniqueId = AbstractSvgComposer.uniqueCssId++;
	var iMapa = 0;
	this.UpdateTextStyle(z);

	if (mapItems.length === 0) return;

	for (var i = 0; i < dataItems.length; i++) {
		if (variableId === dataItems[i]['VID']) {
			var fid = parseFloat(dataItems[i]['FID']);
			// avanza en mapa
			while (mapItems[iMapa].id < fid) {
				if (++iMapa === mapItems.length) {
					break;
				}
			}
			if (iMapa === mapItems.length) {
				break;
			}
			var mapItem = mapItems[iMapa];
			if (mapItem.id == fid) {
				var mergedFeature = this.processFeature(tileUniqueId, dataItems[i], mapItem, patternValue);
				if (mergedFeature) {
					filtered.push(mergedFeature);
				}
			}
		}
	}
	var parentAttributes = {
		metricId: this.activeSelectedMetric.properties.Metric.Id,
		metricVersionId: this.activeSelectedMetric.SelectedVersion().Version.Id,
		levelId: this.activeSelectedMetric.SelectedLevel().Id,
		variableId: this.activeSelectedMetric.SelectedVariable().Id,
		showInfo: (this.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo ? "1" : "0")
	};
	return this.CreateSVGOverlay(tileUniqueId, div, parentAttributes, filtered, z, patternValue,
																			gradient, texture);
};

DataShapeComposer.prototype.GetTileCacheKey = function (x, y, z) {
	if (!this.activeSelectedMetric || !this.activeSelectedMetric.HasSelectedVariable()) {
		return null;
	}
	var v = this.activeSelectedMetric.SelectedVariable().Id;
	return h.getVariableFrameKey(v, x, y, z);
};

DataShapeComposer.prototype.labelValueIsVisible = function (val) {
		var valKey = 'K' + val;
	if (!(valKey in this.labelsVisibility)) {
		this.labelsVisibility[valKey] = this.activeSelectedMetric.ResolveValueLabelVisibility(val);
	}
	return this.labelsVisibility[valKey];
};

DataShapeComposer.prototype.processFeature = function (tileUniqueId, dataElement, mapElement, patternValue) {
	// Se fija si por etiqueta está visible
	var val = dataElement['LID'];
	if (!this.labelValueIsVisible(val)) {
		return null;
	}

	// Lo agrega
	var isLineString = (mapElement.geometry.type === 'LineString' || mapElement.geometry.type === 'MultiLineString' ? ' ls' : '');
	var mapItem = {
		id: mapElement.id, type: mapElement.type, geometry: mapElement.geometry,
					properties: { className: 'e' + tileUniqueId + '_' + val + isLineString }
	};
	if (dataElement.Description) {
		mapItem.properties.description = dataElement.Description.replaceAll('"', '&#x22;');
	}
	var variable = this.activeSelectedMetric.SelectedVariable();
	if (!variable.IsSimpleCount) {
		mapItem.properties.value = this.FormatValue(variable, dataElement);
	}
	if (this.patternUseFillStyles(patternValue)) {
		mapItem.properties.patternClass = 'cs' + val;
	}
	return mapItem;
};

DataShapeComposer.prototype.AddFeatureText = function (variable, val, dataElement, effectiveId, tileKey, tileBounds, colorMap, zoom) {
	if (variable.ShowValues == 0 && (dataElement.Description === null
		|| parseInt(variable.ShowDescriptions) == 0)) {
		return;
	}
	var centroid = new window.google.maps.LatLng(dataElement['Lat'], dataElement['Lon']);
	if (this.inTile(tileBounds, centroid)) {
		// identifica superposiciones en el mismo tile
		// y descarta markers
		this.ResolveValueLabel(variable, effectiveId, dataElement, centroid, tileKey, colorMap[val], null, zoom);
	}
};
