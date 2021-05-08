import AbstractSvgComposer from './AbstractSvgComposer';
import h from '@/public/js/helper';

export default DataShapeComposer;

function DataShapeComposer(mapsApi, activeSelectedMetric) {
	AbstractSvgComposer.call(this, mapsApi, activeSelectedMetric);

	this.useGradients = window.SegMap.Configuration.UseGradients;
	this.useTextures = window.SegMap.Configuration.UseTextures;
};

DataShapeComposer.prototype = new AbstractSvgComposer();

DataShapeComposer.prototype.render = function (mapResults, dataResults, gradient, tileKey, div, x, y, z, tileBounds) {
	var filtered = [];
	var allKeys = [];
	var mapItems = mapResults.Data.features;
	var projected = mapResults.Data.projected;
	var dataItems = dataResults.Data;
	var texture = dataResults.Texture;
	if (this.activeSelectedMetric.HasSelectedVariable() === false) {
		return;
	}
	var variableId = this.activeSelectedMetric.SelectedVariable().Id;
	var patternValue = parseInt(this.activeSelectedMetric.GetPattern());
	var tileUniqueId = AbstractSvgComposer.uniqueCssId++;
	var id;
	var varId;
	var iMapa = 0;
	this.UpdateTextStyle(z);
	var colorMap = this.activeSelectedMetric.GetStyleColorDictionary();

	if (mapItems.length === 0) return;

	for (var i = 0; i < dataItems.length; i++) {
		varId = dataItems[i]['VariableId'];
		if (varId === variableId) {
			id = dataItems[i]['FID'];
			var fid = parseFloat(id);
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
				this.processFeature(tileUniqueId, dataItems[i], mapItem, tileKey, tileBounds, filtered, patternValue, colorMap);
			}
		}
	}
	this.keysInTile[tileKey] = allKeys;
//	console.warn(tileKey + ' ' + (gradient !== null ? 1 : 0));
	var parentAttributes = {
		metricId: this.activeSelectedMetric.properties.Metric.Id,
		metricVersionId: this.activeSelectedMetric.SelectedVersion().Version.Id,
		levelId: this.activeSelectedMetric.SelectedLevel().Id,
		variableId: this.activeSelectedMetric.SelectedVariable().Id
	};
	var svg = this.CreateSVGOverlay(tileUniqueId, div, parentAttributes, filtered, projected, tileBounds, z, patternValue,
																			gradient, texture);
	if (svg !== null) {
		this.SaveSvg(svg, x, y, z);
	}
};

DataShapeComposer.prototype.GetSvgKey = function (x, y, z) {
	if (!this.activeSelectedMetric || !this.activeSelectedMetric.HasSelectedVariable()) {
		return null;
	}
	var v = this.activeSelectedMetric.SelectedVariable().Id;
	return h.getVariableFrameKey(v, x, y, z);
};

DataShapeComposer.prototype.processFeature = function (tileUniqueId, dataElement, mapElement, tileKey, tileBounds, filtered, patternValue, colorMap) {
	// Se fija si por etiqueta está visible
	var val = dataElement['ValueId'];
	var valKey = 'K' + val;
	if (!(valKey in this.labelsVisibility)) {
		this.labelsVisibility[valKey] = this.activeSelectedMetric.ResolveValueLabelVisibility(val);
	}
	if (this.labelsVisibility[valKey] === false) {
		return;
	}
	// Lo agrega
	var centroid = this.getCentroid(mapElement);
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
	var clickId = null;
	if (this.activeSelectedMetric.SelectedLevel().Dataset.ShowInfo) {
		clickId = this.activeSelectedMetric.CreateParentInfo(variable, dataElement);
	} else {
		mapItem.id = null;
	}
	if (this.patternUseFillStyles(patternValue)) {
		mapItem.properties.patternClass = 'cs' + val;
	}
	this.AddFeatureText(variable, val, dataElement, clickId, centroid, tileKey, tileBounds, colorMap);

	filtered.push(mapItem);
};


DataShapeComposer.prototype.getCentroid = function (mapElement) {
	if (mapElement['properties'] && mapElement['properties'].centroid) {
		return new window.google.maps.LatLng(mapElement['properties'].centroid[0], mapElement['properties'].centroid[1]);
	} else {
		return h.getGeojsonCenter(mapElement);
	}
};

DataShapeComposer.prototype.AddFeatureText = function (variable, val, dataElement, effectiveId, centroid, tileKey, tileBounds, colorMap) {
	if (variable.ShowValues == 0 && (dataElement.Description === null
		|| parseInt(variable.ShowDescriptions) == 0)) {
		return;
	}
	if (this.inTile(tileBounds, centroid)) {
		this.ResolveValueLabel(variable, effectiveId, dataElement, centroid, tileKey, colorMap[val]);
	}
};
